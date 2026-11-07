import {
  introductoryProgress,
  normalizeProgress,
  type Progress,
} from "../src/engine/progress";
import {
  ApiError,
  body,
  cookie,
  hash,
  json,
  randomToken,
  setCookie,
} from "./shared";

const VERSION = 3;
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();
export type Learner = { id: string; email: string; wallets: string[] };
export type ProgressIdentity = {
  scope: "learner" | "wallet";
  id: string;
  wallet: string;
  learner: Learner | null;
};
export async function learnerSession(
  request: Request,
  env: Env,
  required = false,
): Promise<Learner | null> {
  const token = cookie(request, "sl_learner");
  if (/^[a-f0-9]{64}$/.test(token)) {
    const row = await env.DB.prepare(
      "SELECT learners.id, learners.email FROM learner_sessions JOIN learners ON learners.id = learner_sessions.learner_id WHERE token_hash = ? AND expires_at > ?",
    )
      .bind(await hash(token), Date.now())
      .first<{ id: string; email: string }>();
    if (row) {
      const linked = await env.DB.prepare(
        "SELECT wallet FROM learner_wallets WHERE learner_id = ? ORDER BY linked_at",
      )
        .bind(row.id)
        .all<{ wallet: string }>();
      return { ...row, wallets: linked.results.map((r) => r.wallet) };
    }
  }
  if (required)
    throw new ApiError(401, "Sign in to your learner account first");
  return null;
}
export async function progressIdentity(
  request: Request,
  env: Env,
  expected: unknown,
  expectedLearner: string | null,
): Promise<ProgressIdentity> {
  const learner = await learnerSession(request, env);
  if (expectedLearner && learner?.id !== expectedLearner)
    throw new ApiError(
      403,
      "The signed-in learner changed. Reload before saving",
    );
  const token = cookie(request, "sl_session");
  const legacy = /^[a-f0-9]{64}$/.test(token)
    ? await env.DB.prepare(
        "SELECT wallet FROM auth_sessions WHERE token_hash = ? AND expires_at > ?",
      )
        .bind(await hash(token), Date.now())
        .first<{ wallet: string }>()
    : null;
  const owner =
    typeof expected === "string" ? expected : (legacy?.wallet ?? "anon");
  if (
    legacy?.wallet === owner ||
    (expectedLearner === learner?.id && learner?.wallets.includes(owner))
  )
    return { scope: "wallet", id: owner, wallet: owner, learner };
  if (learner && expectedLearner === learner.id)
    return { scope: "learner", id: learner.id, wallet: owner, learner };
  if (legacy) throw new ApiError(403, "Sign in with the connected wallet");
  throw new ApiError(401, "Sign in to save your progress");
}
/** Keep the shared introductory record monotonic when a linked wallet makes progress. */
export async function syncIntroduction(
  env: Env,
  learnerId: string,
  progress: Progress,
) {
  const portable = introductoryProgress(progress);
  await env.DB.prepare(
    `INSERT INTO learner_progress (learner_id, course_version, progress, revision, updated_at) VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(learner_id, course_version) DO UPDATE SET progress = excluded.progress, revision = learner_progress.revision + 1, updated_at = excluded.updated_at
    WHERE json_array_length(json_extract(excluded.progress, '$.completed')) > json_array_length(json_extract(learner_progress.progress, '$.completed'))`,
  )
    .bind(learnerId, VERSION, JSON.stringify(portable), Date.now())
    .run();
}
export async function savedProgress(env: Env, identity: ProgressIdentity) {
  // Table and key names are fixed choices, never request-controlled SQL identifiers.
  const table =
    identity.scope === "learner" ? "learner_progress" : "course_progress";
  const key = identity.scope === "learner" ? "learner_id" : "wallet";
  const row = await env.DB.prepare(
    `SELECT progress, revision FROM ${table} WHERE ${key} = ? AND course_version = ?`,
  )
    .bind(identity.id, VERSION)
    .first<{ progress: string; revision: number }>();
  const intro =
    !row && identity.scope === "wallet" && identity.learner
      ? await env.DB.prepare(
          "SELECT progress FROM learner_progress WHERE learner_id = ? AND course_version = ?",
        )
          .bind(identity.learner.id, VERSION)
          .first<{ progress: string }>()
      : null;
  return {
    wallet: identity.wallet,
    scope: identity.scope,
    version: VERSION,
    progress: row
      ? (JSON.parse(row.progress) as Progress)
      : intro
        ? introductoryProgress(JSON.parse(intro.progress) as Progress)
        : null,
    revision: row?.revision ?? 0,
  };
}
function localEmail(request: Request, env: Env) {
  const url = new URL(request.url);
  return (
    env.EMAIL_MODE === "local" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}
function emailAvailable(request: Request, env: Env) {
  return (
    typeof env.EMAIL_CODE_SECRET === "string" &&
    env.EMAIL_CODE_SECRET.length >= 32 &&
    (localEmail(request, env) ||
      (env.EMAIL_MODE === "cloudflare" && !!env.EMAIL && !!env.EMAIL_FROM))
  );
}
async function rate(
  request: Request,
  env: Env,
  scope: string,
  max: number,
  windowMs = 300000,
  subject?: string,
) {
  const now = Date.now();
  const bucket = await hash(
    `${scope}:${subject ?? request.headers.get("CF-Connecting-IP") ?? "local"}:${Math.floor(now / windowMs)}`,
  );
  const row = await env.DB.prepare(
    "INSERT INTO auth_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1 RETURNING attempts",
  )
    .bind(bucket, now + windowMs)
    .first<{ attempts: number }>();
  if (!row || row.attempts > max)
    throw new ApiError(
      429,
      "Too many attempts. Please wait before trying again",
    );
}
async function cleanup(env: Env) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM email_challenges WHERE expires_at <= ?").bind(
      now,
    ),
    env.DB.prepare("DELETE FROM learner_sessions WHERE expires_at <= ?").bind(
      now,
    ),
    env.DB.prepare("DELETE FROM progress_transfers WHERE expires_at <= ?").bind(
      now,
    ),
    env.DB.prepare("DELETE FROM auth_limits WHERE expires_at <= ?").bind(now),
  ]);
}
async function codeKey(env: Env) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(env.EMAIL_CODE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
function loginCode() {
  const sample = new Uint32Array(1);
  do {
    crypto.getRandomValues(sample);
  } while (sample[0] >= 4200000000);
  return String(sample[0] % 100000000).padStart(8, "0");
}
function canonicalProgress(value: unknown) {
  const progress = normalizeProgress(value);
  if (!progress || JSON.stringify(progress) !== JSON.stringify(value))
    throw new ApiError(400, "Invalid course progress");
  return progress;
}
export async function handleAccount(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const now = Date.now();
  if (url.pathname === "/api/account" && request.method === "GET")
    return json({
      learner: await learnerSession(request, env),
      emailAvailable: emailAvailable(request, env),
      localEmail: localEmail(request, env),
    });
  if (url.pathname === "/api/account/code" && request.method === "POST") {
    if (!emailAvailable(request, env))
      throw new ApiError(
        503,
        "Email sign-in is not enabled yet. Use a browser-transfer code or wallet sign-in for now",
      );
    const data = await body(request);
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (
      email.length > 254 ||
      !/^[\x21-\x7e]+$/.test(email) ||
      !/^[^@<>]+@[^@<>]+\.[^@<>]+$/.test(email)
    )
      throw new ApiError(400, "Enter a valid email address");
    await rate(request, env, "email-send-ip", 10);
    await rate(request, env, "email-send-address", 5, 3600000, email);
    await cleanup(env);
    const id = randomToken();
    const code = loginCode();
    const codeHash = bytesToHex(
      await crypto.subtle.sign(
        "HMAC",
        await codeKey(env),
        encoder.encode(`${id}:${email}:${code}`),
      ),
    );
    await env.DB.prepare(
      "INSERT INTO email_challenges (id, email, code_hash, expires_at) VALUES (?, ?, ?, ?)",
    )
      .bind(id, email, codeHash, now + 600000)
      .run();
    try {
      if (!localEmail(request, env)) {
        await env.EMAIL.send({
          to: email,
          from: { email: env.EMAIL_FROM, name: "Solana Learn" },
          subject: "Your Solana Learn sign-in code",
          text: `Your Solana Learn code is ${code}. It expires in 10 minutes. Enter it only on ${url.origin}. Never share this code. If you did not request it, ignore this email.`,
          html: `<p>Your Solana Learn sign-in code is:</p><p><strong>${code}</strong></p><p>It expires in 10 minutes. Enter it only on the Solana Learn website. Never share this code. If you did not request it, ignore this email.</p>`,
        });
      }
    } catch {
      await env.DB.prepare("DELETE FROM email_challenges WHERE id = ?")
        .bind(id)
        .run();
      throw new ApiError(
        503,
        "We could not send the code. Your progress is still available on this device",
      );
    }
    return json(
      { ok: true, ...(localEmail(request, env) ? { localCode: code } : {}) },
      200,
      { "Set-Cookie": setCookie(request, "sl_email", id, 600) },
    );
  }
  if (url.pathname === "/api/account/verify" && request.method === "POST") {
    if (!emailAvailable(request, env))
      throw new ApiError(503, "Email sign-in is not enabled");
    const data = await body(request);
    await rate(request, env, "email-verify", 30);
    const id = cookie(request, "sl_email");
    if (
      !/^[a-f0-9]{64}$/.test(id) ||
      typeof data.code !== "string" ||
      !/^\d{8}$/.test(data.code)
    )
      throw new ApiError(400, "Invalid or expired sign-in code");
    const challenge = await env.DB.prepare(
      "UPDATE email_challenges SET attempts = attempts + 1 WHERE id = ? AND expires_at > ? AND attempts < 5 RETURNING email, code_hash",
    )
      .bind(id, now)
      .first<{ email: string; code_hash: string }>();
    if (!challenge) throw new ApiError(400, "Invalid or expired sign-in code");
    const signature = Uint8Array.from(challenge.code_hash.match(/../g)!, (s) =>
      parseInt(s, 16),
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      await codeKey(env),
      signature,
      encoder.encode(`${id}:${challenge.email}:${data.code}`),
    );
    if (!valid) throw new ApiError(400, "Invalid or expired sign-in code");
    const consumed = await env.DB.prepare(
      "DELETE FROM email_challenges WHERE id = ? AND expires_at > ? RETURNING id",
    )
      .bind(id, now)
      .first();
    if (!consumed) throw new ApiError(400, "Invalid or expired sign-in code");
    const learner = await env.DB.prepare(
      "INSERT INTO learners (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET email = excluded.email RETURNING id",
    )
      .bind(crypto.randomUUID(), challenge.email, now)
      .first<{ id: string }>();
    if (!learner)
      throw new ApiError(503, "Could not create your learner session");
    const token = randomToken();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM learner_sessions WHERE token_hash = ?").bind(
        await hash(cookie(request, "sl_learner")),
      ),
      env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(
        await hash(cookie(request, "sl_session")),
      ),
      env.DB.prepare(
        "INSERT INTO learner_sessions (token_hash, learner_id, expires_at) VALUES (?, ?, ?)",
      ).bind(await hash(token), learner.id, now + SESSION_SECONDS * 1000),
    ]);
    const response = json({ ok: true }, 200);
    response.headers.append(
      "Set-Cookie",
      setCookie(request, "sl_learner", token, SESSION_SECONDS),
    );
    response.headers.append(
      "Set-Cookie",
      setCookie(request, "sl_email", "", 0),
    );
    response.headers.append(
      "Set-Cookie",
      setCookie(request, "sl_session", "", 0),
    );
    return response;
  }
  if (url.pathname === "/api/account/logout" && request.method === "POST") {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM learner_sessions WHERE token_hash = ?").bind(
        await hash(cookie(request, "sl_learner")),
      ),
      env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(
        await hash(cookie(request, "sl_session")),
      ),
    ]);
    const response = json({ ok: true });
    response.headers.append(
      "Set-Cookie",
      setCookie(request, "sl_learner", "", 0),
    );
    response.headers.append(
      "Set-Cookie",
      setCookie(request, "sl_session", "", 0),
    );
    return response;
  }
  if (url.pathname === "/api/transfer/create" && request.method === "POST") {
    await rate(request, env, "transfer-create", 20);
    const data = await body(request);
    if (data.version !== VERSION)
      throw new ApiError(400, "This course version cannot be transferred");
    const progress = introductoryProgress(canonicalProgress(data.progress));
    const code = randomToken().slice(0, 20).toUpperCase();
    await cleanup(env);
    await env.DB.prepare(
      "INSERT INTO progress_transfers (code_hash, course_version, progress, expires_at) VALUES (?, ?, ?, ?)",
    )
      .bind(await hash(code), VERSION, JSON.stringify(progress), now + 600000)
      .run();
    return json({
      code: code.match(/.{4}/g)!.join("-"),
      expiresAt: now + 600000,
    });
  }
  if (url.pathname === "/api/transfer/redeem" && request.method === "POST") {
    await rate(request, env, "transfer-redeem", 30);
    const data = await body(request);
    const code =
      typeof data.code === "string"
        ? data.code.trim().replace(/-/g, "").toUpperCase()
        : "";
    if (!/^[A-F0-9]{20}$/.test(code))
      throw new ApiError(400, "Invalid or expired transfer code");
    const record = await env.DB.prepare(
      "DELETE FROM progress_transfers WHERE code_hash = ? AND expires_at > ? AND course_version = ? RETURNING progress",
    )
      .bind(await hash(code), now, VERSION)
      .first<{ progress: string }>();
    if (!record) throw new ApiError(400, "Invalid or expired transfer code");
    return json({ version: VERSION, progress: JSON.parse(record.progress) });
  }
  return null;
}
