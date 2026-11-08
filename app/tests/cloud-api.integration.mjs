// Exercises real workerd + D1, with disposable local data and generated test wallets.
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import bs58 from "bs58";

const fixture = (stepIndex, completed = [], signature = null) => ({
  version: 4,
  lessonId:
    [
      "1.1",
      "1.2",
      "1.3",
      "security.share",
      "2.1",
      "3.1",
      "fees.explain",
      "4.1",
    ][stepIndex] ?? "5.1",
  stepIndex,
  completed,
  signature,
  assessments: {},
  transferSignature: null,
  programSignature: signature,
});
const state = await mkdtemp(join(tmpdir(), "solana-learn-test-"));
const wrangler = "node_modules/wrangler/bin/wrangler.js";
const origin = "http://127.0.0.1:8799";
const cliEnv = { ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false" };
let worker;
let output = "";
let checks = 0;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function wallet() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
  return { address: bs58.encode(raw), privateKey };
}
function browser() {
  const cookies = new Map();
  return async (path, method = "GET", data, options = {}) => {
    const response = await fetch(origin + path, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...options.headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [key, value] = cookie.split(";")[0].split("=");
      cookies.set(key, value);
    }
    return { status: response.status, data: await response.json(), response };
  };
}
async function login(client, identity) {
  const challenge = await client("/api/auth/challenge", "POST", {
    wallet: identity.address,
  });
  assert.equal(challenge.status, 200);
  const signature = bs58.encode(
    sign(null, Buffer.from(challenge.data.message), identity.privateKey),
  );
  const verified = await client("/api/auth/verify", "POST", { signature });
  assert.equal(verified.status, 200);
  assert.equal(verified.data.wallet, identity.address);
  return signature;
}
function check(name) {
  checks++;
  console.log(`PASS ${name}`);
}
try {
  execFileSync(
    process.execPath,
    [
      wrangler,
      "d1",
      "migrations",
      "apply",
      "DB",
      "--local",
      "--persist-to",
      state,
    ],
    { env: cliEnv, stdio: "pipe" },
  );
  worker = spawn(
    process.execPath,
    [wrangler, "dev", "--port", "8799", "--persist-to", state],
    { env: cliEnv, stdio: ["ignore", "pipe", "pipe"] },
  );
  worker.stdout.on("data", (value) => (output += value));
  worker.stderr.on("data", (value) => (output += value));
  let started = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(origin + "/api/progress");
      if (response.status === 401) {
        started = true;
        break;
      }
    } catch {
      /* Wait for the local runtime to start. */
    }
    await pause(100);
  }
  assert.ok(started, output);
  const a = wallet(),
    b = wallet();
  const first = browser(),
    second = browser(),
    other = browser();
  assert.equal((await first("/api/progress")).status, 401);
  assert.equal((await first("/api/progress", "PUT", {})).status, 401);
  check("unauthenticated reads and writes rejected");
  assert.equal(
    (
      await first(
        "/api/auth/challenge",
        "POST",
        { wallet: a.address },
        { headers: { Origin: "https://attacker.example" } },
      )
    ).status,
    403,
  );
  check("cross-origin writes rejected");
  const signature = await login(first, a);
  assert.equal(
    (await first("/api/auth/verify", "POST", { signature })).status,
    401,
  );
  check("real Ed25519 login and replay rejection");
  const empty = fixture(0);
  const initial = await first(`/api/progress?wallet=${a.address}`);
  assert.equal(initial.data.progress, null);
  const put = (client, progress, revision, owner = a.address) =>
    client("/api/progress", "PUT", {
      wallet: owner,
      version: 4,
      progress,
      revision,
    });
  let save = await put(first, empty, 0);
  assert.equal(save.status, 200);
  assert.equal(save.data.revision, 1);
  assert.equal(save.response.headers.get("cache-control"), "no-store");
  check("first cloud save and cache protection");
  await login(second, a);
  assert.deepEqual((await second("/api/progress")).data.progress, empty);
  assert.equal((await second("/api/progress")).data.revision, 1);
  check("second browser restores the same wallet record");
  assert.equal((await put(second, empty, 0)).status, 409);
  assert.equal((await put(second, empty, 1)).data.revision, 2);
  assert.equal((await put(first, empty, 1)).status, 409);
  check("stale device saves and simultaneous initial inserts cannot overwrite");
  await login(other, b);
  assert.equal((await other("/api/progress")).data.progress, null);
  assert.equal((await put(other, empty, 0, a.address)).status, 403);
  assert.equal((await other(`/api/progress?wallet=${a.address}`)).status, 403);
  assert.equal((await put(other, empty, 0, b.address)).status, 200);
  check("wallet isolation, including shared-cookie account changes");
  const invalid = {
    stepIndex: 1000,
    completed: ["made-up-step"],
    signature: null,
  };
  assert.equal((await put(first, invalid, 2)).status, 400);
  assert.equal(
    (
      await first("/api/progress", "PUT", {
        wallet: a.address,
        version: 2,
        revision: 2,
        progress: empty,
      })
    ).status,
    400,
  );
  assert.equal(
    (await first("/api/auth/challenge", "POST", { wallet: "invalid" })).status,
    400,
  );
  check("progress schema, course version, and wallet validation");
  const tampered = browser();
  const challenge = await tampered("/api/auth/challenge", "POST", {
    wallet: a.address,
  });
  const wrong = bs58.encode(
    sign(null, Buffer.from(challenge.data.message), b.privateKey),
  );
  assert.equal(
    (await tampered("/api/auth/verify", "POST", { signature: wrong })).status,
    401,
  );
  assert.equal((await tampered("/api/progress")).status, 401);
  check("wrong-wallet signature rejected");
  const advanced = fixture(1, ["1.1"]);
  save = await put(first, advanced, 2);
  assert.equal(save.status, 200);
  assert.equal((await put(first, empty, save.data.revision)).status, 200);
  assert.deepEqual((await second("/api/progress")).data.progress, empty);
  check("course reset persists across browsers");
  assert.equal((await first("/api/auth/logout", "POST", {})).status, 200);
  assert.equal((await first("/api/progress")).status, 401);
  assert.equal((await second("/api/progress")).status, 200);
  check("logout revokes only the current browser session");
  const large = await other("/api/auth/challenge", "POST", {
    wallet: b.address,
    padding: "x".repeat(17000),
  });
  assert.equal(large.status, 413);
  let limited;
  for (let i = 0; i < 21; i++)
    limited = await other("/api/auth/challenge", "POST", { wallet: b.address });
  assert.equal(limited.status, 429);
  check("bounded request bodies and challenge rate limiting");
  assert.equal((await fetch(origin)).status, 200);
  assert.equal((await other("/api/unknown")).status, 404);
  check("frontend assets served and unknown API routes return JSON");
  console.log(`${checks} Cloudflare integration checks passed`);
} catch (error) {
  console.error(output.slice(-4000));
  throw error;
} finally {
  if (worker && worker.exitCode === null) {
    const exited = once(worker, "exit");
    worker.kill("SIGTERM");
    await exited;
  }
  await rm(state, { recursive: true, force: true });
}
