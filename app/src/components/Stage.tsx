import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { MISSIONS } from "../content/missions";
import { useMissionEngine } from "../engine/useMissionEngine";
import { ActionZone } from "./ActionZone";

export function Stage() {
  const { publicKey } = useWallet();
  const owner = publicKey?.toBase58() ?? "anon";
  // A new session on account change prevents old async work and wallet-specific state crossing accounts.
  return <CourseSession key={owner} owner={owner} />;
}
function CourseSession({ owner }: { owner: string }) {
  const engine = useMissionEngine(owner);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const { step, stepIndex, completed, steps, missionIndex } = engine;
  const finished =
    step.action === "summary" && completed.length === steps.length - 1;
  const percent = finished
    ? 100
    : Math.round((completed.length / (steps.length - 1)) * 100);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [stepIndex]);
  return (
    <div className="learning-app">
      <a className="skip-link" href="#lesson">
        Skip to lesson
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Solana Learn home">
          <span className="brand-symbol" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span>
            solana<span className="brand-light">learn</span>
          </span>
        </a>
        <div className="header-divider" />
        <span className="header-course">The essentials, in practice</span>
        <div className="header-actions">
          <span className="network-pill">
            <span />
            Devnet <span className="network-extra">· Test funds only</span>
          </span>
          <WalletMultiButton />
        </div>
      </header>
      <div className="course-layout">
        <aside
          className={`course-sidebar ${outlineOpen ? "is-open" : ""}`}
          aria-label="Course outline"
        >
          <div className="sidebar-top">
            <span className="eyebrow">YOUR LEARNING PATH</span>
            <h2>Solana essentials</h2>
            <p>
              Understand the action.
              <br />
              Then try it for yourself.
            </p>
          </div>
          <div className="course-progress">
            <div>
              <span>Course progress</span>
              <strong>{percent}%</strong>
            </div>
            <progress value={percent} max={100} aria-label="Course progress" />
            <small>
              {Math.min(completed.length, steps.length - 1)} of{" "}
              {steps.length - 1} steps complete
            </small>
          </div>
          <nav aria-label="Lessons">
            {MISSIONS.map((mission, index) => {
              const active = index === missionIndex;
              const complete =
                mission.steps.every((s) => completed.includes(s.id)) ||
                (index === 6 && finished);
              const target = steps.findIndex(
                (s) => s.id === mission.steps[0].id,
              );
              return (
                <div
                  className={`outline-module ${active ? "active" : ""}`}
                  key={mission.id}
                >
                  <button
                    className="module-button"
                    disabled={
                      target > completed.length || engine.status === "checking"
                    }
                    aria-current={active ? "step" : undefined}
                    onClick={() => {
                      engine.navigate(target);
                      setOutlineOpen(false);
                    }}
                  >
                    <span
                      className={`module-number ${complete ? "complete" : ""}`}
                    >
                      {complete ? "✓" : String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{mission.name}</strong>
                      <small>{mission.description}</small>
                    </span>
                    {active && <span className="active-dot" />}
                  </button>
                  {active && mission.steps.length > 1 && (
                    <div className="substeps">
                      {mission.steps.map((s) => {
                        const i = steps.findIndex((item) => item.id === s.id);
                        return (
                          <button
                            key={s.id}
                            disabled={
                              i > completed.length ||
                              engine.status === "checking"
                            }
                            aria-current={i === stepIndex ? "step" : undefined}
                            onClick={() => engine.navigate(i)}
                          >
                            <span aria-hidden>
                              {completed.includes(s.id) ? "✓" : "·"}
                            </span>
                            {s.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="sidebar-note">
            <span aria-hidden>↗</span>
            <div>
              <strong>A practice space, on purpose.</strong>
              <p>
                Free test funds. Your own wallet.
                <br />
                No deposits required.
              </p>
            </div>
          </div>
          <div className="restart-area">
            {!confirmReset ? (
              <button
                className="text-button"
                onClick={() => setConfirmReset(true)}
              >
                Restart course
              </button>
            ) : (
              <div>
                <p>
                  Clear this account’s course progress? Your wallet and funds
                  stay unchanged.
                </p>
                <button
                  className="text-button"
                  disabled={engine.status === "checking"}
                  onClick={() => {
                    engine.restart();
                    setConfirmReset(false);
                  }}
                >
                  Reset progress
                </button>
                <button
                  className="text-button"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </aside>
        <main className="course-main" id="lesson">
          <button
            className="outline-toggle"
            aria-expanded={outlineOpen}
            onClick={() => setOutlineOpen(!outlineOpen)}
          >
            {outlineOpen ? "Close" : "View"} course outline{" "}
            <span>{percent}% complete</span>
          </button>
          <div className="breadcrumb">
            Solana essentials <span>/</span> {engine.mission.name}
          </div>
          {engine.storageFailed && (
            <p className="feedback warning" role="status">
              This browser could not save progress. You can continue, but your
              place may be lost after refreshing.
            </p>
          )}
          <article className="lesson-content" key={step.id}>
            <div className="lesson-meta">
              <span className="eyebrow">
                LESSON {String(missionIndex + 1).padStart(2, "0")}
              </span>
              <span className="meta-line" />
              <span>
                {stepIndex + 1} / {steps.length} steps
              </span>
            </div>
            <h1 ref={heading} tabIndex={-1}>
              {step.title}
            </h1>
            <p className="lesson-objective">{step.objective}</p>
            <div className="lesson-why">
              <span className="section-label">WHY THIS MATTERS</span>
              <p>{step.why}</p>
            </div>
            <section
              className="instructions"
              aria-labelledby="instructions-heading"
            >
              <h2 id="instructions-heading">
                {step.action === "summary"
                  ? "Check your understanding"
                  : "Here’s what to do"}
              </h2>
              <ol>
                {step.instructions.map((instruction, index) => (
                  <li key={instruction}>
                    <span className="instruction-number" aria-hidden>
                      {index + 1}
                    </span>
                    <p>{instruction}</p>
                  </li>
                ))}
              </ol>
            </section>
            {step.safety && (
              <aside className="safety-note">
                <span className="safety-icon" aria-hidden>
                  !
                </span>
                <div>
                  <strong>Keep this in mind</strong>
                  <p>{step.safety}</p>
                </div>
              </aside>
            )}
            <ActionZone engine={engine} />
            <section className="expected-result">
              <span className="result-icon" aria-hidden>
                ↳
              </span>
              <div>
                <h2>What to expect</h2>
                <p>{step.expected}</p>
              </div>
            </section>
            <div className="lesson-details">
              {step.terms.length > 0 && (
                <details>
                  <summary>
                    Understand the terms <span aria-hidden>+</span>
                  </summary>
                  <dl>
                    {step.terms.map((term) => (
                      <div key={term.term}>
                        <dt>{term.term}</dt>
                        <dd>{term.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
              <details>
                <summary>
                  Having trouble? <span aria-hidden>+</span>
                </summary>
                <p>{step.troubleshooting}</p>
                {step.source && (
                  <a href={step.source.href} target="_blank" rel="noreferrer">
                    {step.source.label} ↗
                  </a>
                )}
              </details>
            </div>
            <footer className="lesson-navigation">
              <button
                className="button button-quiet"
                disabled={stepIndex === 0 || engine.status === "checking"}
                onClick={engine.goBack}
              >
                ← Back
              </button>
              <span>
                {step.action === "summary"
                  ? "Keep learning at your own pace."
                  : engine.passed
                    ? "Ready for the next step"
                    : "Take your time. There’s no timer."}
              </span>
              {step.action !== "summary" && (
                <button
                  className="button button-primary"
                  disabled={!engine.canGoNext || engine.status === "checking"}
                  onClick={engine.goNext}
                >
                  {stepIndex === steps.length - 2
                    ? "Review your progress"
                    : "Continue"}{" "}
                  <span aria-hidden>→</span>
                </button>
              )}
            </footer>
          </article>
          <footer className="page-footer">
            <span>Learn by doing. Understand before signing.</span>
            <span>Practice on Solana Devnet</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
