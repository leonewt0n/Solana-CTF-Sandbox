import { flattenSteps } from "../content/missions";
export const STEPS = flattenSteps();
export const STORAGE_PREFIX = "solana-learn:v3:";
export type Progress = {
  stepIndex: number;
  completed: string[];
  signature: string | null;
};
export const emptyProgress = (): Progress => ({
  stepIndex: 0,
  completed: [],
  signature: null,
});
const connectIndex = STEPS.findIndex((step) => step.action === "connect");
export function readProgress(
  owner: string,
  storage: Pick<Storage, "getItem"> = localStorage,
): Progress | null {
  try {
    const raw = storage.getItem(STORAGE_PREFIX + owner);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Number.isInteger(data.stepIndex) || !Array.isArray(data.completed))
      return null;
    // Only restore a contiguous completed prefix. Local storage is convenience, not proof.
    const completed: string[] = [];
    for (const step of STEPS) {
      if (!data.completed.includes(step.id)) break;
      completed.push(step.id);
    }
    const signature =
      typeof data.signature === "string" &&
      /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(data.signature)
        ? data.signature
        : null;
    const txIndex = STEPS.findIndex((s) => s.action === "transaction");
    if (!signature && completed.length > txIndex) completed.splice(txIndex);
    return {
      stepIndex: Math.max(
        0,
        Math.min(data.stepIndex, completed.length, STEPS.length - 1),
      ),
      completed,
      signature,
    };
  } catch {
    return null;
  }
}
export function initialProgress(owner: string): Progress {
  const saved = readProgress(owner);
  if (saved) return saved;
  // Only the contiguous pre-connection learning prefix follows the learner into a new account.
  // Later wallet activity, transaction receipts, and results remain account-specific.
  const setup =
    owner === "anon"
      ? []
      : (readProgress("anon")?.completed ?? []).slice(0, connectIndex);
  return { ...emptyProgress(), completed: setup, stepIndex: setup.length };
}
export function completeStep(progress: Progress, id: string): Progress {
  if (progress.completed.includes(id)) return progress;
  const next = STEPS[progress.completed.length];
  return next?.id === id
    ? { ...progress, completed: [...progress.completed, id] }
    : progress;
}
