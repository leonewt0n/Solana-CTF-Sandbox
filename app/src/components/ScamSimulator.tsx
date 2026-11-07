import { useId, useState } from "react";
import { SCAM_SCENARIOS, type ScamScenario } from "../content/scams";
import { Icon } from "./Icon";

/** This component intentionally has no wallet, RPC, network, clipboard, or account dependencies. */
export function ScamSimulator({ scenarioId }: { scenarioId: string }) {
  const scenario = SCAM_SCENARIOS.find((item) => item.id === scenarioId);
  return scenario ? <Simulation key={scenarioId} scenario={scenario} /> : null;
}
function Simulation({ scenario }: { scenario: ScamScenario }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [comparison, setComparison] = useState(false);
  const [clues, setClues] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const request =
    comparison && scenario.comparison ? scenario.comparison : scenario.request;
  const choice = request.choices.find((item) => item.id === selected);
  const recommended = choice?.id === request.recommended;
  function changeExample(value: boolean) {
    setComparison(value);
    setSelected(null);
    setClues(false);
  }
  return (
    <section
      className="scam-simulator"
      aria-label={`${scenario.title} simulation`}
    >
      <div className="simulation-banner">
        <Icon name="shield" size={19} />
        <strong>TRAINING SIMULATION</strong>
        <span>No wallet request. No funds or secrets.</span>
      </div>
      {scenario.comparison && (
        <div
          className="simulation-comparisons"
          role="group"
          aria-label="Compare training examples"
        >
          <button
            aria-pressed={!comparison}
            onClick={() => changeExample(false)}
          >
            {scenario.request.label}
          </button>
          <button aria-pressed={comparison} onClick={() => changeExample(true)}>
            {scenario.comparison.label}
          </button>
        </div>
      )}
      <div className="simulation-invitation">
        <span className="eyebrow">{request.kind}</span>
        <h2>{request.label}</h2>
        <p>{request.claim}</p>
        <button
          className="button button-secondary"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide simulated request" : "Review simulated request"}
        </button>
      </div>
      {open && (
        <div className="simulation-request" id={id}>
          <div className="simulation-request-header">
            <Icon name="wallet" size={24} />
            <div>
              <strong>Fictional request</strong>
              <span>This is part of the lesson, not your wallet.</span>
            </div>
          </div>
          <dl className="simulation-fields">
            <div>
              <dt>Requesting site or source</dt>
              <dd>
                <code>{request.origin}</code>
              </dd>
            </div>
            {request.fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div
            className="simulation-choices"
            role="group"
            aria-label="Choose a simulated response"
          >
            {request.choices.map((item) => (
              <button
                className={`button ${item.id === "stop" ? "button-secondary" : "button-primary"}`}
                key={item.id}
                onClick={() => setSelected(item.id)}
                aria-pressed={selected === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
          {choice && (
            <div
              className={`simulation-feedback ${recommended ? "is-recommended" : "is-risky"}`}
              role="status"
            >
              <strong>
                {recommended
                  ? "A considered response."
                  : "Let’s inspect that choice."}
              </strong>
              <p>{choice.feedback}</p>
              <p>
                Only this training panel changed. No signature, transaction,
                download, or secret submission occurred.
              </p>
            </div>
          )}
          <button
            className="text-button"
            aria-expanded={clues}
            onClick={() => setClues((value) => !value)}
          >
            {clues ? "Hide the clues" : "Show the clues"}
          </button>
          {clues && (
            <ul className="simulation-clues">
              {request.clues.map((clue) => (
                <li key={clue}>{clue}</li>
              ))}
            </ul>
          )}
          {selected && (
            <button
              className="text-button"
              onClick={() => {
                setSelected(null);
                setClues(false);
              }}
            >
              Reset simulation
            </button>
          )}
        </div>
      )}
      <p className="simulation-footnote">
        Names, domains, destinations, and amounts are fictional. Training
        domains are not links, and no recovery-phrase entry is provided.
      </p>
    </section>
  );
}
