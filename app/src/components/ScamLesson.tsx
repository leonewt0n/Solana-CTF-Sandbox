import { useState } from "react";
import { LIVE_SCAMS } from "../content/liveScams";
import { ScamSimulator } from "./ScamSimulator";
import { LiveScamExercise } from "./LiveScamExercise";

/** The preview itself retains zero wallet or network dependencies. */
export function ScamLesson({ scenarioId }: { scenarioId: string }) {
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!LIVE_SCAMS[scenarioId]) return <ScamSimulator scenarioId={scenarioId} />;
  return (
    <div className="scam-lesson">
      <div
        className="live-mode-picker"
        role="group"
        aria-label="Scam lesson mode"
      >
        <button
          aria-pressed={!live}
          disabled={busy}
          onClick={() => setLive(false)}
        >
          Preview
        </button>
        <button
          aria-pressed={live}
          disabled={busy}
          onClick={() => setLive(true)}
        >
          Real wallet practice
        </button>
      </div>
      {live ? (
        <LiveScamExercise scenarioId={scenarioId} onBusy={setBusy} />
      ) : (
        <ScamSimulator scenarioId={scenarioId} />
      )}
    </div>
  );
}
