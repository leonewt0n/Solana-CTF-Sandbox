import bs58 from "bs58";
import { normalizeProgress, type Progress } from "../src/engine/progress";

const VERSION = 3;
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
function cookie(request: Request, name: string) {
  return (
    request.headers
      .get("Cookie")
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(name + "="))
      ?.slice(name.length + 1) ?? ""
  );
}
function setCookie(
  request: Request,
  name: string,
  value: string,
  seconds: number,
) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure}`;
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    throw new ApiError(415, "JSON required");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Missing body");
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new ApiError(413, "Request too large");
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "Invalid JSON");
  }
}
function walletKey(wallet: unknown) {
  try {
    if (typeof wallet !== "string" || wallet.length > 44) throw new Error();
    const key = bs58.decode(wallet);
    if (key.length !== 32) throw new Error();
    return key;
  } catch {
    throw new ApiError(400, "Invalid wallet address");
  }
}
async function session(request: Request, env: Env) {
  const token = cookie(request, "sl_session");
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new ApiError(401, "Sign in to sync progress");
  const result = await env.DB.prepare(
    "SELECT wallet FROM auth_sessions WHERE token_hash = ? AND expires_at > ?",
  )
    .bind(await hash(token), Date.now())
    .first<{ wallet: string }>();
  if (!result) throw new ApiError(401, "Session expired. Sign in again");
  return result.wallet;
}
async function saved(env: Env, wallet: string) {
  const row = await env.DB.prepare(
    "SELECT progress, revision FROM course_progress WHERE wallet = ? AND course_version = ?",
  )
    .bind(wallet, VERSION)
    .first<{ progress: string; revision: number }>();
  return {
    wallet,
    version: VERSION,
    progress: row ? (JSON.parse(row.progress) as Progress) : null,
    revision: row?.revision ?? 0,
  };
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      if (!["GET", "POST", "PUT"].includes(request.method))
        throw new ApiError(405, "Method not allowed");
      if (
        request.method !== "GET" &&
        request.headers.get("Origin") !== url.origin
      )
        throw new ApiError(403, "Origin rejected");
      if (!env.DB)
        throw new ApiError(503, "Progress storage is not configured");
      const now = Date.now();
      if (url.pathname === "/api/auth/challenge" && request.method === "POST") {
        const data = await body(request);
        walletKey(data.wallet);
        // IP hashes expire with the five-minute rate window. Never log wallet signatures or cookies.
        const bucket = await hash(
          `${request.headers.get("CF-Connecting-IP") ?? "local"}:${Math.floor(now / 300000)}`,
        );
        const limit = await env.DB.prepare(
          "INSERT INTO auth_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1 RETURNING attempts",
        )
          .bind(bucket, now + 300000)
          .first<{ attempts: number }>();
        if (!limit || limit.attempts > 20)
          return json(
            { error: "Too many login attempts. Try again in five minutes" },
            429,
            { "Retry-After": "300" },
          );
        const id = randomToken();
        const message = `${url.host} requests a Solana Learn login.\n\nWallet: ${data.wallet}\nURI: ${url.origin}\nNonce: ${id}\nIssued at: ${new Date(now).toISOString()}\nExpires at: ${new Date(now + 300000).toISOString()}\n\nSign in to save course progress. No transaction, SOL fee, or asset access.`;
        await env.DB.batch([
          env.DB.prepare(
            "DELETE FROM auth_challenges WHERE expires_at <= ?",
          ).bind(now),
          env.DB.prepare(
            "DELETE FROM auth_sessions WHERE expires_at <= ?",
          ).bind(now),
          env.DB.prepare("DELETE FROM auth_limits WHERE expires_at <= ?").bind(
            now,
          ),
          env.DB.prepare(
            "INSERT INTO auth_challenges (id, wallet, message, expires_at) VALUES (?, ?, ?, ?)",
          ).bind(id, data.wallet, message, now + 300000),
        ]);
        return json({ message }, 200, {
          "Set-Cookie": setCookie(request, "sl_challenge", id, 300),
        });
      }
      if (url.pathname === "/api/auth/verify" && request.method === "POST") {
        const data = await body(request);
        const id = cookie(request, "sl_challenge");
        if (!/^[a-f0-9]{64}$/.test(id))
          throw new ApiError(401, "Login challenge expired");
        // Consume before checking the signature: each challenge allows exactly one attempt.
        const challenge = await env.DB.prepare(
          "DELETE FROM auth_challenges WHERE id = ? AND expires_at > ? RETURNING wallet, message",
        )
          .bind(id, now)
          .first<{ wallet: string; message: string }>();
        if (!challenge)
          throw new ApiError(401, "Login challenge expired or already used");
        let signature: Uint8Array;
        try {
          if (typeof data.signature !== "string" || data.signature.length > 100)
            throw new Error();
          signature = bs58.decode(data.signature);
          if (signature.length !== 64) throw new Error();
        } catch {
          throw new ApiError(400, "Invalid signature");
        }
        const key = await crypto.subtle.importKey(
          "raw",
          new Uint8Array(walletKey(challenge.wallet)),
          { name: "Ed25519" },
          false,
          ["verify"],
        );
        const valid = await crypto.subtle.verify(
          "Ed25519",
          key,
          new Uint8Array(signature),
          encoder.encode(challenge.message),
        );
        if (!valid) throw new ApiError(401, "Wallet signature rejected");
        const token = randomToken();
        // Rotate the browser session on login.
        await env.DB.batch([
          env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(
            await hash(cookie(request, "sl_session")),
          ),
          env.DB.prepare(
            "INSERT INTO auth_sessions (token_hash, wallet, expires_at) VALUES (?, ?, ?)",
          ).bind(
            await hash(token),
            challenge.wallet,
            now + SESSION_SECONDS * 1000,
          ),
        ]);
        return json({ wallet: challenge.wallet }, 200, {
          "Set-Cookie": setCookie(
            request,
            "sl_session",
            token,
            SESSION_SECONDS,
          ),
        });
      }
      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?")
          .bind(await hash(cookie(request, "sl_session")))
          .run();
        return json({ ok: true }, 200, {
          "Set-Cookie": setCookie(request, "sl_session", "", 0),
        });
      }
      if (url.pathname === "/api/progress") {
        const wallet = await session(request, env);
        if (
          url.searchParams.has("wallet") &&
          url.searchParams.get("wallet") !== wallet
        )
          throw new ApiError(403, "Sign in with the connected wallet");
        if (request.method === "GET") return json(await saved(env, wallet));
        if (request.method === "PUT") {
          const data = await body(request);
          if (data.wallet !== wallet)
            throw new ApiError(403, "Sign in with the connected wallet");
          const progress = normalizeProgress(data.progress);
          if (
            data.version !== VERSION ||
            !Number.isSafeInteger(data.revision) ||
            Number(data.revision) < 0 ||
            !progress ||
            JSON.stringify(progress) !== JSON.stringify(data.progress)
          )
            throw new ApiError(400, "Invalid course progress");
          // Compare-and-swap prevents an old tab or device from silently overwriting a newer save.
          const result =
            data.revision === 0
              ? await env.DB.prepare(
                  "INSERT INTO course_progress (wallet, course_version, progress, revision, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(wallet, course_version) DO NOTHING RETURNING revision",
                )
                  .bind(wallet, VERSION, JSON.stringify(progress), now)
                  .first<{ revision: number }>()
              : await env.DB.prepare(
                  "UPDATE course_progress SET progress = ?, revision = revision + 1, updated_at = ? WHERE wallet = ? AND course_version = ? AND revision = ? RETURNING revision",
                )
                  .bind(
                    JSON.stringify(progress),
                    now,
                    wallet,
                    VERSION,
                    data.revision,
                  )
                  .first<{ revision: number }>();
          if (!result)
            return json(
              {
                error: "Progress changed on another device",
                ...(await saved(env, wallet)),
              },
              409,
            );
          return json({
            wallet,
            version: VERSION,
            progress,
            revision: result.revision,
          });
        }
      }
      throw new ApiError(404, "API route not found");
    } catch (error) {
      if (error instanceof ApiError)
        return json({ error: error.message }, error.status);
      console.error(
        JSON.stringify({ event: "progress_api_error", path: url.pathname }),
      );
      return json(
        {
          error:
            "Progress service unavailable. Your browser progress is still saved",
        },
        503,
      );
    }
  },
} satisfies ExportedHandler<Env>;
