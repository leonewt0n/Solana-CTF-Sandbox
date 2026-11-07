import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MISSIONS } from "../content/missions";
import { assertDevnet } from "../lib/network";
import { castSpell, checkFlag } from "./checks";
import {
  completeStep,
  emptyProgress,
  initialProgress,
  STEPS,
  STORAGE_PREFIX,
} from "./progress";

export function useMissionEngine(owner: string) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [progress, setProgress] = useState(() => initialProgress(owner));
  const [status, setStatus] = useState<"idle" | "checking" | "failed">("idle");
  const [failReason, setFailReason] = useState<string | null>(null);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const operation = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(true);
  const step = STEPS[progress.stepIndex];
  const passed = progress.completed.includes(step.id);
  const missionIndex = MISSIONS.findIndex((m) =>
    m.steps.some((s) => s.id === step.id),
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + owner, JSON.stringify(progress));
    } catch {
      // Report failure of this external storage write; this is not derived render state.
      // eslint-disable-next-line react/set-state-in-effect
      setStorageFailed(true);
    }
  }, [owner, progress]);
  const pass = useCallback((id: string) => {
    setProgress((p) => completeStep(p, id));
  }, []);

  useEffect(() => {
    if (step.action === "connect" && wallet.connected && wallet.publicKey) {
      // Synchronize completion with the external wallet connection event.
      // eslint-disable-next-line react/set-state-in-effect
      pass(step.id);
    }
  }, [step, wallet.connected, wallet.publicKey, pass]);

  useEffect(() => {
    if (step.action !== "faucet" || !wallet.publicKey) return;
    const publicKey = wallet.publicKey;
    let cancelled = false;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        await assertDevnet(connection);
        if (cancelled) return;
        const balance = await connection.getBalance(publicKey, "confirmed");
        if (cancelled) return;
        setBalanceLamports(balance);
        setFailReason(null);
        if (balance > 0) pass(step.id);
      } catch (error) {
        if (!cancelled)
          setFailReason(
            error instanceof Error &&
              error.message.includes("Incorrect cluster")
              ? "network"
              : "balance-rpc",
          );
      } finally {
        pending = false;
      }
    }
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [connection, step, wallet.publicKey, pass]);

  function navigate(index: number) {
    if (
      busy.current ||
      index < 0 ||
      index >= STEPS.length ||
      index > progress.completed.length
    )
      return;
    operation.current++;
    setProgress((p) => ({ ...p, stepIndex: index }));
    setStatus("idle");
    setFailReason(null);
    setBalanceLamports(null);
  }
  async function run(kind: "transaction" | "flag", input = "") {
    if (busy.current || passed || step.action !== kind) return;
    busy.current = true;
    const token = ++operation.current;
    setStatus("checking");
    setFailReason(null);
    try {
      const result =
        kind === "transaction"
          ? await castSpell(connection, wallet)
          : await checkFlag(input);
      if (!mounted.current || token !== operation.current) return;
      if (result.signature)
        setProgress((p) => ({ ...p, signature: result.signature! }));
      if (result.ok) pass(step.id);
      else setFailReason(result.reason);
      setStatus(result.ok ? "idle" : "failed");
    } catch {
      if (mounted.current && token === operation.current) {
        setStatus("failed");
        setFailReason("unknown");
      }
    } finally {
      if (token === operation.current) busy.current = false;
    }
  }
  function restart() {
    if (busy.current) return;
    operation.current++;
    setProgress(emptyProgress());
    setStatus("idle");
    setFailReason(null);
    setBalanceLamports(null);
  }
  return {
    step,
    stepIndex: progress.stepIndex,
    steps: STEPS,
    missionIndex,
    mission: MISSIONS[missionIndex],
    completed: progress.completed,
    signature: progress.signature,
    balanceLamports,
    status,
    failReason,
    passed,
    storageFailed,
    canGoNext: passed || step.verification === "read",
    checkAnswer: (optionId: string) => {
      if (step.action !== "quiz" || !step.quiz || busy.current) return false;
      const correct = optionId === step.quiz.correct;
      if (correct) pass(step.id);
      return correct;
    },
    confirmManual: () => {
      if (step.verification === "self") pass(step.id);
    },
    runCast: () => run("transaction"),
    runFlag: (value: string) => run("flag", value),
    goNext: () => {
      if (step.verification === "read") {
        pass(step.id);
        setProgress((p) => ({
          ...p,
          stepIndex: Math.min(p.stepIndex + 1, STEPS.length - 1),
        }));
      } else if (passed) navigate(progress.stepIndex + 1);
    },
    goBack: () => navigate(progress.stepIndex - 1),
    navigate,
    restart,
  };
}
export type MissionEngine = ReturnType<typeof useMissionEngine>;
