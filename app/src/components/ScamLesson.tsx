import type { Assessment } from "../content/scams";
import { ScamSimulator } from "./ScamSimulator";
/** Threat lessons never expose live wallet launch controls. */
export function ScamLesson({
  scenarioId,
  onAssessment,
}: {
  scenarioId: string;
  onAssessment?: (result: Assessment | null) => void;
}) {
  return <ScamSimulator scenarioId={scenarioId} onAssessment={onAssessment} />;
}
