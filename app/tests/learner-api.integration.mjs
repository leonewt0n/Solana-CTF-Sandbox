// Disposable workerd/D1 tests. Local email mode never sends to real recipients.
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import bs58 from "bs58";
const state = await mkdtemp(join(tmpdir(), "solana-learn-accounts-"));
const wrangler = "node_modules/wrangler/bin/wrangler.js";
const origin = "http://127.0.0.1:8801";
const env = {
  ...process.env,
  CI: "true",
  NO_DNA: "1",
  WRANGLER_SEND_METRICS: "false",
};
let worker,
  output = "",
  checks = 0;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function cli(...args) {
  return execFileSync(process.execPath, [wrangler, ...args], {
    env,
    stdio: "pipe",
  });
}
function sql(command) {
  cli(
    "d1",
    "execute",
    "DB",
    "--local",
    "--persist-to",
    state,
    "--command",
    command,
  );
}
function browser() {
  const cookies = new Map();
  let learnerId;
  return {
    identify(id) {
      learnerId = id;
    },
    async request(path, method = "GET", data, headers = {}) {
      const response = await fetch(origin + path, {
        method,
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
          ...(learnerId ? { "X-Learner-ID": learnerId } : {}),
          ...headers,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      for (const cookie of response.headers.getSetCookie()) {
        assert.ok(
          cookie.includes("HttpOnly") && cookie.includes("SameSite=Strict"),
        );
        const [key, value] = cookie.split(";")[0].split("=");
        cookies.set(key, value);
      }
      return { status: response.status, data: await response.json() };
    },
  };
}
function identity() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    wallet: bs58.encode(
      publicKey.export({ format: "der", type: "spki" }).subarray(-32),
    ),
    privateKey,
  };
}
async function walletLogin(client, key, learner) {
  const challenge = await client.request("/api/auth/challenge", "POST", {
    wallet: key.wallet,
    ...(learner ? { linkLearner: true, learnerId: learner.id } : {}),
  });
  assert.equal(challenge.status, 200, JSON.stringify(challenge));
  if (learner) assert.ok(challenge.data.message.includes(learner.email));
  const signature = bs58.encode(
    sign(null, Buffer.from(challenge.data.message), key.privateKey),
  );
  return client.request("/api/auth/verify", "POST", { signature });
}
async function emailLogin(client, email) {
  const issued = await client.request("/api/account/code", "POST", { email });
  assert.equal(issued.status, 200, JSON.stringify(issued));
  assert.match(issued.data.localCode, /^\d{8}$/);
  const verified = await client.request("/api/account/verify", "POST", {
    code: issued.data.localCode,
  });
  assert.equal(verified.status, 200, JSON.stringify(verified));
  const account = await client.request("/api/account");
  assert.ok(account.data.learner.id);
  client.identify(account.data.learner.id);
  return account.data.learner;
}
function check(name) {
  checks++;
  console.log(`PASS ${name}`);
}
try {
  cli("d1", "migrations", "apply", "DB", "--local", "--persist-to", state);
  worker = spawn(
    process.execPath,
    [
      wrangler,
      "dev",
      "--port",
      "8801",
      "--persist-to",
      state,
      "--var",
      "EMAIL_MODE:local",
      "--var",
      "EMAIL_CODE_SECRET:local-integration-only-secret-not-for-production",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  worker.stdout.on("data", (v) => (output += v));
  worker.stderr.on("data", (v) => (output += v));
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(origin + "/api/account")).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await pause(100);
  }
  assert.ok(ready, output);
  const source = browser(),
    destination = browser(),
    stranger = browser();
  const content = await readFile("src/content/missions.ts", "utf8");
  const steps = [...content.matchAll(/^        id: "([^"]+)"/gm)].map(
    (match) => match[1],
  );
  const connect = steps.indexOf("2.1"),
    transaction = steps.indexOf("5.1");
  assert.ok(connect > 0 && transaction > connect);
  const intro = { stepIndex: 2, completed: steps.slice(0, 2), signature: null };
  const empty = { stepIndex: 0, completed: [], signature: null };
  const full = {
    stepIndex: transaction + 1,
    completed: steps.slice(0, transaction + 1),
    signature: "5".repeat(88),
  };
  assert.equal((await source.request("/api/account")).data.learner, null);
  const transfer = await source.request("/api/transfer/create", "POST", {
    version: 3,
    progress: full,
  });
  assert.equal(transfer.status, 200);
  assert.match(transfer.data.code, /^[A-F0-9]{4}(-[A-F0-9]{4}){4}$/);
  const restored = await destination.request("/api/transfer/redeem", "POST", {
    code: transfer.data.code,
  });
  assert.equal(restored.status, 200);
  assert.deepEqual(restored.data.progress, {
    stepIndex: connect,
    completed: steps.slice(0, connect),
    signature: null,
  });
  assert.equal((await destination.request("/api/account")).data.learner, null);
  assert.equal((await destination.request("/api/progress")).status, 401);
  assert.equal(
    (
      await destination.request("/api/transfer/redeem", "POST", {
        code: transfer.data.code,
      })
    ).status,
    400,
  );
  check(
    "cross-browser transfer restores introductory lessons, strips receipts, grants no session, and is single-use",
  );
  const expired = await source.request("/api/transfer/create", "POST", {
    version: 3,
    progress: intro,
  });
  sql("UPDATE progress_transfers SET expires_at = 0");
  assert.equal(
    (
      await destination.request("/api/transfer/redeem", "POST", {
        code: expired.data.code,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await source.request("/api/transfer/create", "POST", {
        version: 2,
        progress: intro,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await source.request(
        "/api/transfer/create",
        "POST",
        { version: 3, progress: intro },
        { Origin: "https://attacker.example" },
      )
    ).status,
    403,
  );
  check("transfer expiry, course-version, and origin checks");
  const accountA = await emailLogin(source, "learner-a@example.test");
  assert.equal(
    (await source.request("/api/account/verify", "POST", { code: "12345678" }))
      .status,
    400,
  );
  const first = await source.request("/api/progress", "PUT", {
    wallet: "anon",
    version: 3,
    revision: 0,
    progress: intro,
  });
  assert.equal(first.status, 200, JSON.stringify(first));
  assert.equal(first.data.scope, "learner");
  await emailLogin(destination, "learner-a@example.test");
  assert.deepEqual(
    (await destination.request("/api/progress?wallet=anon")).data.progress,
    intro,
  );
  assert.equal(
    (
      await destination.request("/api/progress", "PUT", {
        wallet: "anon",
        version: 3,
        revision: 0,
        progress: empty,
      })
    ).status,
    409,
  );
  check(
    "email-only account saves and restores across browsers with replay protection and revision checks",
  );
  const accountB = await emailLogin(stranger, "learner-b@example.test");
  assert.equal(
    (await stranger.request("/api/progress?wallet=anon")).data.progress,
    null,
  );
  assert.equal(
    (
      await source.request("/api/progress?wallet=anon", "GET", undefined, {
        "X-Learner-ID": accountB.id,
      })
    ).status,
    403,
  );
  check("learner isolation and stale-tab account identity checks");
  const key = identity(),
    legacy = browser();
  assert.equal((await walletLogin(legacy, key)).status, 200);
  assert.equal(
    (
      await legacy.request("/api/progress", "PUT", {
        wallet: key.wallet,
        version: 3,
        revision: 0,
        progress: full,
      })
    ).status,
    200,
  );
  const before = (await legacy.request("/api/progress")).data;
  await emailLogin(legacy, "learner-a@example.test");
  assert.equal(
    (await legacy.request("/api/account")).data.learner.wallets.length,
    0,
  );
  assert.equal((await walletLogin(legacy, key, accountA)).status, 200);
  const after = (await legacy.request(`/api/progress?wallet=${key.wallet}`))
    .data;
  assert.deepEqual(after.progress, before.progress);
  assert.equal(after.revision, before.revision);
  assert.ok(
    (await legacy.request("/api/account")).data.learner.wallets.includes(
      key.wallet,
    ),
  );
  const walletRestore = await destination.request(
    `/api/progress?wallet=${key.wallet}`,
  );
  assert.equal(walletRestore.status, 200);
  assert.deepEqual(walletRestore.data.progress, full);
  const anonRestore = await destination.request("/api/progress?wallet=anon");
  assert.equal(anonRestore.data.progress.signature, null);
  assert.equal(anonRestore.data.progress.completed.length, connect);
  check(
    "wallet linking requires a signature, preserves legacy receipts/revisions, and restores linked-wallet history with email login",
  );
  assert.equal((await walletLogin(stranger, key, accountB)).status, 409);
  assert.deepEqual(
    (await destination.request(`/api/progress?wallet=${key.wallet}`)).data
      .progress,
    full,
  );
  check("a wallet cannot be silently reassigned to another learner");
  assert.equal(
    (await legacy.request("/api/account/logout", "POST", {})).status,
    200,
  );
  assert.equal((await legacy.request("/api/account")).data.learner, null);
  assert.equal((await legacy.request("/api/progress")).status, 403);
  legacy.identify(undefined);
  assert.equal((await legacy.request("/api/progress")).status, 401);
  assert.equal(
    (await destination.request("/api/progress?wallet=anon")).status,
    200,
  );
  check(
    "learner logout revokes the current learner and legacy wallet session without affecting another browser",
  );
  const freshWallet = identity();
  assert.equal((await walletLogin(source, freshWallet, accountA)).status, 200);
  const carried = await destination.request(
    `/api/progress?wallet=${freshWallet.wallet}`,
  );
  assert.equal(carried.status, 200);
  assert.equal(carried.data.revision, 0);
  assert.equal(carried.data.progress.completed.length, connect);
  assert.equal(carried.data.progress.signature, null);
  check(
    "newly linked wallets inherit introductory learning even before their first wallet save",
  );
  const independent = { stepIndex: 1, completed: [steps[1]], signature: null };
  assert.equal(
    (
      await stranger.request("/api/progress", "PUT", {
        wallet: "anon",
        version: 3,
        revision: 0,
        progress: independent,
      })
    ).status,
    200,
  );
  const independentWallet = identity();
  assert.equal(
    (await walletLogin(stranger, independentWallet, accountB)).status,
    200,
  );
  const otherCheck = { stepIndex: 0, completed: [steps[0]], signature: null };
  assert.equal(
    (
      await stranger.request("/api/progress", "PUT", {
        wallet: independentWallet.wallet,
        version: 3,
        revision: 0,
        progress: otherCheck,
      })
    ).status,
    200,
  );
  const mergedChecks = await stranger.request("/api/progress?wallet=anon");
  assert.deepEqual(mergedChecks.data.progress.completed, steps.slice(0, 2));
  check(
    "out-of-order introductory checks from a linked wallet merge without losing equally sized learner records",
  );
  const locked = browser();
  const issued = await locked.request("/api/account/code", "POST", {
    email: "locked@example.test",
  });
  const wrong = String(
    (Number(issued.data.localCode) + 1) % 100000000,
  ).padStart(8, "0");
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await locked.request("/api/account/verify", "POST", { code: wrong }))
        .status,
      400,
    );
  assert.equal(
    (
      await locked.request("/api/account/verify", "POST", {
        code: issued.data.localCode,
      })
    ).status,
    400,
  );
  check("email codes lock after five failed attempts");
  const stale = browser();
  const issue = await stale.request("/api/account/code", "POST", {
    email: "expired@example.test",
  });
  sql("UPDATE email_challenges SET expires_at = 0");
  assert.equal(
    (
      await stale.request("/api/account/verify", "POST", {
        code: issue.data.localCode,
      })
    ).status,
    400,
  );
  check("expired email codes cannot create sessions");
  console.log(`${checks} learner-account integration checks passed`);
} catch (error) {
  console.error(output.slice(-2500));
  throw error;
} finally {
  if (worker && worker.exitCode === null) {
    const exit = once(worker, "exit");
    worker.kill("SIGTERM");
    await exit;
  }
  await rm(state, { recursive: true, force: true });
}
