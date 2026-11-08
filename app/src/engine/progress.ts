import { flattenSteps } from "../content/missions";
import { LEGACY_LESSON_IDS } from "../content/legacyLessonIds";
import { validAssessment, type Assessment } from "../content/scams";
export const STEPS = flattenSteps();
export const STORAGE_PREFIX = "solana-learn:v4:";
export type Progress = {
  stepIndex: number;
  completed: string[];
  signature: string | null;
  version?: 4;
  lessonId?: string;
  assessments?: Record<string, Assessment>;
  transferSignature?: string | null;
  programSignature?: string | null;
};
export const emptyProgress = (): Progress => ({
  version: 4,
  lessonId: STEPS[0].id,
  stepIndex: 0,
  completed: [],
  signature: null,
  assessments: {},
  transferSignature: null,
  programSignature: null,
});
const signatureValue = (value: unknown) =>
  typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(value)
    ? value
    : null;
const portableIds = new Set([
  "web3.why",
  "web3.blockchain",
  "solana.why",
  "web3.uses",
  "1.1",
  "1.2",
  "1.3",
  "security.share",
]);
export function normalizeProgress(data: unknown): Progress | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Progress;
  if (!Number.isInteger(record.stepIndex) || !Array.isArray(record.completed))
    return null;
  const legacy = record.version !== 4;
  const lessonId = legacy
    ? LEGACY_LESSON_IDS[record.stepIndex]
    : record.lessonId;
  const stepIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.id === lessonId),
  );
  const programSignature = signatureValue(
    record.programSignature ?? record.signature,
  );
  const transferSignature = legacy
    ? null
    : signatureValue(record.transferSignature);
  const assessments: Record<string, Assessment> = {};
  if (!legacy && record.assessments && typeof record.assessments === "object") {
    for (const step of STEPS) {
      const result = record.assessments[step.id];
      if (
        step.scamScenario &&
        result &&
        typeof result.inspection === "string" &&
        validAssessment(step.scamScenario, result)
      )
        assessments[step.id] = result;
    }
  }
  const completed = STEPS.filter(
    (step) =>
      step.action !== "summary" &&
      record.completed.includes(step.id) &&
      (!step.scamScenario || !!assessments[step.id]) &&
      (!["transaction", "explorer"].includes(step.action) ||
        !!programSignature) &&
      (step.action !== "transfer" || !!transferSignature),
  ).map((s) => s.id);
  return {
    version: 4,
    lessonId: STEPS[stepIndex].id,
    stepIndex,
    completed,
    signature: programSignature,
    assessments,
    transferSignature,
    programSignature,
  };
}
export function readProgress(
  owner: string,
  storage: Pick<Storage, "getItem"> = localStorage,
): Progress | null {
  try {
    // Preserve the original v3 record, including its wallet-specific public receipt.
    const raw =
      storage.getItem(STORAGE_PREFIX + owner) ??
      storage.getItem("solana-learn:v3:" + owner);
    return raw ? normalizeProgress(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function initialProgress(owner: string): Progress {
  const saved = readProgress(owner);
  if (saved) return saved;
  const anonymous = owner === "anon" ? null : readProgress("anon");
  return anonymous ? introductoryProgress(anonymous) : emptyProgress();
}
export function completeStep(progress: Progress, id: string): Progress {
  const step = STEPS.find((s) => s.id === id);
  if (!step || step.action === "summary" || progress.completed.includes(id))
    return progress;
  if (
    step.scamScenario &&
    (!progress.assessments?.[id] ||
      !validAssessment(step.scamScenario, progress.assessments[id]))
  )
    return progress;
  if (["transaction", "explorer"].includes(step.action) && !progress.signature)
    return progress;
  if (step.action === "transfer" && !progress.transferSignature)
    return progress;
  return {
    ...progress,
    completed: STEPS.filter(
      (s) => s.id === id || progress.completed.includes(s.id),
    ).map((s) => s.id),
  };
}
/** Only introductory learning travels without proving wallet ownership. */
export function introductoryProgress(progress: Progress): Progress {
  const base = emptyProgress();
  const index = portableIds.has(STEPS[progress.stepIndex]?.id)
    ? progress.stepIndex
    : 0;
  return {
    ...base,
    stepIndex: index,
    lessonId: STEPS[index].id,
    completed: STEPS.filter(
      (s) => portableIds.has(s.id) && progress.completed.includes(s.id),
    ).map((s) => s.id),
  };
}
export function mergeIntroductoryProgress(
  local: Progress,
  incoming: Progress,
): Progress {
  const portable = introductoryProgress(incoming);
  const completed = STEPS.filter(
    (s) => local.completed.includes(s.id) || portable.completed.includes(s.id),
  ).map((s) => s.id);
  const stepIndex =
    local.completed.length === 0 && local.stepIndex === 0
      ? portable.stepIndex
      : local.stepIndex;
  return JSON.stringify(completed) === JSON.stringify(local.completed) &&
    stepIndex === local.stepIndex
    ? local
    : { ...local, completed, stepIndex, lessonId: STEPS[stepIndex].id };
}
