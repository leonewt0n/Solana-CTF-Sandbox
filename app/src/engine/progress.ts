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
export function normalizeProgress(data: unknown): Progress | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("stepIndex" in data) ||
    !("completed" in data)
  )
    return null;
  const record = data as {
    stepIndex: number;
    completed: unknown[];
    signature?: unknown;
  };
  if (!Number.isInteger(record.stepIndex) || !Array.isArray(record.completed))
    return null;
  // Previously only a contiguous completed prefix was restored. Free exploration now preserves independent completed checks.
  // Local storage is convenience, not proof of an on-chain achievement.
  const signature =
    typeof record.signature === "string" &&
    /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(record.signature)
      ? record.signature
      : null;
  const completed = STEPS.filter(
    (step) =>
      step.action !== "summary" &&
      record.completed.includes(step.id) &&
      (signature !== null ||
        !["transaction", "explorer"].includes(step.action)),
  ).map((step) => step.id);
  return {
    stepIndex: Math.max(0, Math.min(record.stepIndex, STEPS.length - 1)),
    completed,
    signature,
  };
}
export function readProgress(
  owner: string,
  storage: Pick<Storage, "getItem"> = localStorage,
): Progress | null {
  try {
    const raw = storage.getItem(STORAGE_PREFIX + owner);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return normalizeProgress(data);
  } catch {
    return null;
  }
}
export function initialProgress(owner: string): Progress {
  const saved = readProgress(owner);
  if (saved) return saved;
  // Only pre-connection learning follows the learner into a new account, including checks completed out of order.
  // Later wallet activity, transaction receipts, and results remain account-specific.
  const anonymous = owner === "anon" ? null : readProgress("anon");
  const setup = introductoryProgress(anonymous ?? emptyProgress()).completed;
  return {
    ...emptyProgress(),
    completed: setup,
    stepIndex: anonymous?.stepIndex ?? 0,
  };
}
export function completeStep(progress: Progress, id: string): Progress {
  if (progress.completed.includes(id)) return progress;
  const step = STEPS.find((item) => item.id === id);
  if (!step || step.action === "summary") return progress;
  if (["transaction", "explorer"].includes(step.action) && !progress.signature)
    return progress;
  return {
    ...progress,
    completed: STEPS.filter(
      (item) => item.id === id || progress.completed.includes(item.id),
    ).map((item) => item.id),
  };
}

/** Only introductory learning travels without proving wallet ownership. */
export function introductoryProgress(progress: Progress): Progress {
  const completed = STEPS.slice(0, connectIndex)
    .filter((step) => progress.completed.includes(step.id))
    .map((step) => step.id);
  return {
    stepIndex: Math.min(progress.stepIndex, connectIndex),
    completed,
    signature: null,
  };
}
export function mergeIntroductoryProgress(
  local: Progress,
  incoming: Progress,
): Progress {
  const portable = introductoryProgress(incoming);
  const completed = STEPS.filter(
    (step) =>
      local.completed.includes(step.id) || portable.completed.includes(step.id),
  ).map((step) => step.id);
  const stepIndex =
    local.completed.length === 0 && local.stepIndex === 0
      ? portable.stepIndex
      : local.stepIndex;
  return JSON.stringify(completed) === JSON.stringify(local.completed) &&
    stepIndex === local.stepIndex
    ? local
    : { ...local, completed, stepIndex };
}
