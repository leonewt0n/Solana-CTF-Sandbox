import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import type { LearnerAccount } from "../context/LearnerAccount";
import {
  normalizeProgress,
  introductoryProgress,
  mergeIntroductoryProgress,
  type Progress,
} from "./progress";

type Saved = {
  wallet: string;
  version: number;
  progress: Progress | null;
  revision: number;
  scope?: "learner" | "wallet";
};
type SyncStatus =
  "local" | "loading" | "ready" | "saving" | "conflict" | "error";
class SyncError extends Error {
  status: number;
  saved?: Saved;
  constructor(status: number, message: string, saved?: Saved) {
    super(message);
    this.status = status;
    this.saved = saved;
  }
}
async function api(
  path: string,
  method = "GET",
  data?: unknown,
  learnerId?: string,
) {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(learnerId ? { "X-Learner-ID": learnerId } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new SyncError(
      response.status,
      result.error ?? "Cloud save failed",
      result,
    );
  return result;
}
function validateSaved(data: Saved, owner: string): Saved {
  if (
    data.wallet !== owner ||
    ![3, 4].includes(data.version) ||
    !Number.isSafeInteger(data.revision) ||
    data.revision < 0 ||
    (data.progress !== null && !normalizeProgress(data.progress))
  )
    throw new Error("Cloud progress did not match this wallet");
  return {
    ...data,
    progress: data.progress === null ? null : normalizeProgress(data.progress),
  };
}
export function useProgressSync(
  owner: string,
  progress: Progress,
  restore: (progress: Progress) => void,
  learner: LearnerAccount | null = null,
  onLinked?: () => Promise<void>,
) {
  const wallet = useWallet();
  const [status, setStatus] = useState<SyncStatus>("local");
  const [message, setMessage] = useState(
    "Saved in this browser. Connect a wallet to enable cloud saves.",
  );
  const [conflict, setConflict] = useState<Saved | null>(null);
  const [tick, setTick] = useState(0);
  const latest = useRef(progress);
  const restoreRef = useRef(restore);
  const revision = useRef(0);
  const scope = useRef<"learner" | "wallet">("wallet");
  const savedText = useRef<string | null>(null);
  const ready = useRef(false);
  const running = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    latest.current = progress;
    restoreRef.current = restore;
  });
  const accept = useCallback(
    (data: Saved) => {
      const saved = validateSaved(data, owner);
      scope.current = saved.scope ?? "wallet";
      revision.current = saved.revision;
      if (saved.scope === "wallet" && saved.revision === 0 && saved.progress) {
        // A newly linked wallet has no wallet record yet. Carry the learner's introductory progress into it.
        const merged = mergeIntroductoryProgress(
          latest.current,
          saved.progress,
        );
        if (merged !== latest.current) restoreRef.current(merged);
        savedText.current = null;
        ready.current = true;
        setConflict(null);
        setStatus("ready");
        setMessage("Your introductory learning is restored for this wallet.");
        setTick((n) => n + 1);
        return;
      }
      savedText.current =
        saved.progress === null ? null : JSON.stringify(saved.progress);
      if (
        saved.progress &&
        savedText.current !==
          JSON.stringify(
            scope.current === "learner"
              ? introductoryProgress(latest.current)
              : latest.current,
          )
      ) {
        if (
          latest.current.completed.length === 0 &&
          latest.current.stepIndex === 0 &&
          !latest.current.signature
        ) {
          restoreRef.current(saved.progress);
          ready.current = true;
          setConflict(null);
          setStatus("ready");
          setMessage("Your saved learning is restored.");
          setTick((n) => n + 1);
          return;
        }
        ready.current = false;
        setConflict(saved);
        setStatus("conflict");
        setMessage(
          "This device and your cloud save differ. Choose which progress to keep.",
        );
      } else {
        ready.current = true;
        setConflict(null);
        setStatus("ready");
        setMessage(
          saved.scope === "learner" && owner !== "anon"
            ? "Introductory progress saves with your learner account. Link this wallet to save wallet practice."
            : learner
              ? "Cloud saves enabled for your learner account."
              : "Cloud saves enabled for this wallet.",
        );
        setTick((n) => n + 1);
      }
    },
    [owner, learner],
  );
  const load = useCallback(
    async (token: number, quiet = false) => {
      try {
        const data = await api(
          `progress?wallet=${encodeURIComponent(owner)}`,
          "GET",
          undefined,
          learner?.id,
        );
        if (token === generation.current) accept(data);
      } catch (error) {
        if (token !== generation.current) return;
        ready.current = false;
        if (quiet || (error instanceof SyncError && error.status === 401)) {
          setStatus("local");
          setMessage("Saved in this browser. Sign in to sync across devices.");
        } else {
          setStatus("error");
          setMessage(
            "Cloud unavailable. Browser progress is saved. Retry when online.",
          );
        }
      }
    },
    [accept, owner, learner?.id],
  );
  useEffect(() => {
    const token = ++generation.current;
    if (owner !== "anon" || learner) void load(token, true);
    return () => {
      // This counter intentionally invalidates requests from the unmounted account session.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      ready.current = false;
    };
    // The course session remounts on every wallet change.
  }, [owner, load, learner]);
  useEffect(() => {
    if (
      !ready.current ||
      running.current ||
      (owner === "anon" && !learner) ||
      savedText.current ===
        JSON.stringify(
          scope.current === "learner"
            ? introductoryProgress(progress)
            : progress,
        )
    )
      return;
    setStatus("saving");
    setMessage("Changes pending cloud save…");
    const token = generation.current;
    const timer = setTimeout(() => {
      if (!ready.current || token !== generation.current) return;
      const outgoing =
        scope.current === "learner"
          ? introductoryProgress(latest.current)
          : latest.current;
      running.current = true;
      setStatus("saving");
      setMessage("Saving progress…");
      void api(
        "progress",
        "PUT",
        {
          wallet: owner,
          version: 4,
          revision: revision.current,
          progress: outgoing,
        },
        learner?.id,
      )
        .then((data) => {
          if (token !== generation.current) return;
          const saved = validateSaved(data, owner);
          revision.current = saved.revision;
          savedText.current = JSON.stringify(saved.progress);
          const current = JSON.stringify(
            scope.current === "learner"
              ? introductoryProgress(latest.current)
              : latest.current,
          );
          const acknowledged = savedText.current === current;
          setStatus(acknowledged ? "ready" : "saving");
          setMessage(
            !acknowledged
              ? "Changes pending cloud save…"
              : saved.scope === "learner" && owner !== "anon"
                ? "Introductory progress saved. Link this wallet to save wallet practice."
                : "Progress saved to your account.",
          );
        })
        .catch((error) => {
          if (token !== generation.current) return;
          ready.current = false;
          if (
            error instanceof SyncError &&
            error.status === 409 &&
            error.saved
          ) {
            try {
              accept(error.saved);
            } catch {
              setStatus("error");
              setMessage(
                "Cloud response did not match this wallet. Sign in again.",
              );
            }
          } else {
            setStatus(
              error instanceof SyncError && error.status === 401
                ? "local"
                : "error",
            );
            setMessage(
              error instanceof SyncError && error.status === 401
                ? "Session expired. Browser progress is saved. Sign in again."
                : "Cloud unavailable. Browser progress is saved. Retry when online.",
            );
          }
        })
        .finally(() => {
          running.current = false;
          if (token === generation.current) setTick((n) => n + 1);
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [progress, owner, tick, accept, learner]);
  async function signIn() {
    if (running.current || owner === "anon") return;
    if (!wallet.signMessage) {
      setMessage(
        "This wallet cannot sign login messages. Browser saves still work.",
      );
      return;
    }
    const token = ++generation.current;
    ready.current = false;
    setConflict(null);
    setStatus("loading");
    setMessage(
      "Approve the login message in your wallet. No transaction or SOL fee.",
    );
    try {
      const challenge = await api("auth/challenge", "POST", {
        wallet: owner,
        ...(learner ? { linkLearner: true, learnerId: learner.id } : {}),
      });
      if (token !== generation.current) return;
      if (
        typeof challenge.message !== "string" ||
        !challenge.message.includes(`Wallet: ${owner}\n`) ||
        !challenge.message.includes(`URI: ${window.location.origin}\n`)
      )
        throw new Error("Invalid login message");
      const signature = await wallet.signMessage(
        new TextEncoder().encode(challenge.message),
      );
      if (token !== generation.current) return;
      await api("auth/verify", "POST", { signature: bs58.encode(signature) });
      if (token === generation.current) {
        await load(token);
        await onLinked?.();
      }
    } catch (error) {
      if (token !== generation.current) return;
      setStatus("local");
      setMessage(
        error instanceof SyncError
          ? error.message
          : "Login was not completed. Browser progress is saved.",
      );
    }
  }
  async function signOut() {
    if (running.current) return;
    const token = ++generation.current;
    ready.current = false;
    setStatus("loading");
    try {
      await api("auth/logout", "POST", {});
      if (token !== generation.current) return;
      setConflict(null);
      setStatus("local");
      setMessage(
        "Signed out of cloud saves. Browser progress remains on this device.",
      );
    } catch {
      if (token !== generation.current) return;
      setStatus("error");
      setMessage("Could not sign out of cloud saves. Retry when online.");
    }
  }
  function resolve(useCloud: boolean) {
    if (!conflict) return;
    if (useCloud && conflict.progress) restoreRef.current(conflict.progress);
    ready.current = true;
    setConflict(null);
    setStatus("ready");
    setMessage(
      useCloud ? "Using your cloud save." : "Using this device’s progress.",
    );
    setTick((n) => n + 1);
  }
  return {
    status,
    message,
    signIn,
    signOut,
    resolve,
    retry: () => {
      setStatus("loading");
      void load(++generation.current);
    },
  };
}
