import bs58 from "bs58";
import {
  normalizeProgress,
  introductoryProgress,
} from "../src/engine/progress";

const VERSION = 3;
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();
import {
  ApiError,
  json,
  cookie,
  setCookie,
  hash,
  randomToken,
  body,
  walletKey,
} from "./shared";
import {
  handleAccount,
  learnerSession,
  progressIdentity,
  savedProgress,
  syncIntroduction,
} from "./accounts";
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
      const accountResponse = await handleAccount(request, env);
      if (accountResponse) return accountResponse;
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
        const linking =
          data.linkLearner === true
            ? await learnerSession(request, env, true)
            : null;
        if (linking && data.learnerId !== linking.id)
          throw new ApiError(
            403,
            "The learner account changed. Reload before linking",
          );
        const id = randomToken();
        const message = `${url.host} requests a Solana Learn ${linking ? `wallet link to your learner account (${linking.email})` : "login"}.\n\nWallet: ${data.wallet}\nURI: ${url.origin}\nNonce: ${id}\nIssued at: ${new Date(now).toISOString()}\nExpires at: ${new Date(now + 300000).toISOString()}\n\nSign in to save course progress. No transaction, SOL fee, or asset access.`;
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
            "INSERT INTO auth_challenges (id, wallet, message, expires_at, learner_id) VALUES (?, ?, ?, ?, ?)",
          ).bind(id, data.wallet, message, now + 300000, linking?.id ?? null),
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
          "DELETE FROM auth_challenges WHERE id = ? AND expires_at > ? RETURNING wallet, message, learner_id",
        )
          .bind(id, now)
          .first<{
            wallet: string;
            message: string;
            learner_id: string | null;
          }>();
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
        if (challenge.learner_id) {
          const learner = await learnerSession(request, env, true);
          if (learner?.id !== challenge.learner_id)
            throw new ApiError(
              403,
              "The learner account changed. Start wallet linking again",
            );
          const linked = await env.DB.prepare(
            "INSERT INTO learner_wallets (wallet, learner_id, linked_at) VALUES (?, ?, ?) ON CONFLICT(wallet) DO UPDATE SET linked_at = excluded.linked_at WHERE learner_id = excluded.learner_id RETURNING learner_id",
          )
            .bind(challenge.wallet, learner.id, now)
            .first<{ learner_id: string }>();
          if (!linked)
            throw new ApiError(
              409,
              "This wallet is already linked to another learner account. Sign in to that account to use it",
            );
          const prior = await savedProgress(env, {
            scope: "wallet",
            id: challenge.wallet,
            wallet: challenge.wallet,
            learner,
          });
          if (prior.progress)
            await syncIntroduction(env, learner.id, prior.progress);
        }
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
        const data = request.method === "PUT" ? await body(request) : null;
        const identity = await progressIdentity(
          request,
          env,
          data?.wallet ?? url.searchParams.get("wallet"),
          request.headers.get("X-Learner-ID"),
        );
        const wallet = identity.wallet;
        if (request.method === "GET")
          return json(await savedProgress(env, identity));
        if (request.method === "PUT" && data) {
          const rawProgress = normalizeProgress(data.progress);
          const progress =
            rawProgress && identity.scope === "learner"
              ? introductoryProgress(rawProgress)
              : rawProgress;
          if (
            data.version !== VERSION ||
            !Number.isSafeInteger(data.revision) ||
            Number(data.revision) < 0 ||
            !progress ||
            JSON.stringify(rawProgress) !== JSON.stringify(data.progress)
          )
            throw new ApiError(400, "Invalid course progress");
          // Compare-and-swap prevents an old tab or device from silently overwriting a newer save.
          const table =
            identity.scope === "learner"
              ? "learner_progress"
              : "course_progress";
          const key = identity.scope === "learner" ? "learner_id" : "wallet";
          const result =
            data.revision === 0
              ? await env.DB.prepare(
                  `INSERT INTO ${table} (${key}, course_version, progress, revision, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(${key}, course_version) DO NOTHING RETURNING revision`,
                )
                  .bind(identity.id, VERSION, JSON.stringify(progress), now)
                  .first<{ revision: number }>()
              : await env.DB.prepare(
                  `UPDATE ${table} SET progress = ?, revision = revision + 1, updated_at = ? WHERE ${key} = ? AND course_version = ? AND revision = ? RETURNING revision`,
                )
                  .bind(
                    JSON.stringify(progress),
                    now,
                    identity.id,
                    VERSION,
                    data.revision,
                  )
                  .first<{ revision: number }>();
          if (!result)
            return json(
              {
                error: "Progress changed on another device",
                ...(await savedProgress(env, identity)),
              },
              409,
            );
          if (
            identity.scope === "wallet" &&
            identity.learner?.wallets.includes(wallet)
          )
            await syncIntroduction(env, identity.learner.id, progress);
          return json({
            wallet,
            scope: identity.scope,
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
