import { useState, type RefObject } from "react";
import { SCAM_SCENARIOS } from "../content/scams";
import { ScamSimulator } from "./ScamSimulator";

export function ScamPractice({
  heading,
}: {
  heading: RefObject<HTMLHeadingElement | null>;
}) {
  const [selected, setSelected] = useState(SCAM_SCENARIOS[0].id);
  const scenario = SCAM_SCENARIOS.find((item) => item.id === selected)!;
  return (
    <div className="scam-practice-page">
      <span className="eyebrow">SCAM PRACTICE</span>
      <h1 ref={heading} tabIndex={-1}>
        Practice the pause before approval.
      </h1>
      <p className="lesson-objective">
        Explore {SCAM_SCENARIOS.length} fictional scenarios. No wallet
        connection is needed.
      </p>
      <p className="panel-caption">
        Free practice keeps your course position unchanged. Course learning
        checks are saved when you reach those lessons.
      </p>
      <label className="scenario-picker">
        Choose a scenario
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {SCAM_SCENARIOS.map((item, index) => (
            <option key={item.id} value={item.id}>
              {index + 1}. {item.title}
            </option>
          ))}
        </select>
      </label>
      <p className="lesson-objective">{scenario.objective}</p>
      <p>{scenario.setup}</p>
      <ScamSimulator key={scenario.id} scenarioId={scenario.id} />
      <aside className="safety-note">
        <div>
          <strong>The habit to keep</strong>
          <p>{scenario.takeaway}</p>
        </div>
      </aside>
      <a
        className="inline-link"
        href={scenario.source.href}
        target="_blank"
        rel="noreferrer"
      >
        {scenario.source.label} ↗
      </a>
    </div>
  );
}
