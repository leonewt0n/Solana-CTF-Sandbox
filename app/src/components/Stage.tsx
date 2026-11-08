import { useEffect, useRef, useState, type RefObject } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { MISSIONS, type Mission } from "../content/missions";
import {
  useMissionEngine,
  type MissionEngine,
} from "../engine/useMissionEngine";
import { ActionZone } from "./ActionZone";
import { LearningVisual } from "./LearningVisual";
import { LessonScene, LessonExplanation } from "./LessonExperience";
import { chapterArtwork } from "../content/presentation";
import { Celebration } from "./Celebration";
import { Glossary } from "./Glossary";
import { Icon } from "./Icon";
import { ScamLesson } from "./ScamLesson";
import { ScamPractice } from "./ScamPractice";
import { PlatformOverview } from "./PlatformOverview";
import { LearnerAccess } from "./LearnerAccess";
import {
  LearnerAccountProvider,
  useLearnerAccount,
} from "../context/LearnerAccount";
import { useProgressSync } from "../engine/useProgressSync";

type View = "overview" | "lesson" | "progress" | "scams";
export function Stage() {
  return (
    <LearnerAccountProvider>
      <StageContent />
    </LearnerAccountProvider>
  );
}
function StageContent() {
  const account = useLearnerAccount();
  const { publicKey } = useWallet();
  const [view, setView] = useState<View>("overview");
  return (
    <CourseSession
      key={`${publicKey?.toBase58() ?? "anon"}:${account.learner?.id ?? "guest"}`}
      owner={publicKey?.toBase58() ?? "anon"}
      view={view}
      setView={setView}
    />
  );
}
function CourseSession({
  owner,
  view,
  setView,
}: {
  owner: string;
  view: View;
  setView: (view: View) => void;
}) {
  const engine = useMissionEngine(owner);
  const account = useLearnerAccount();
  const sync = useProgressSync(
    owner,
    engine.progress,
    engine.restoreProgress,
    account.learner,
    account.refresh,
  );
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const taskCount = engine.steps.length - 1;
  const progress = Math.round(
    (engine.steps.filter(
      (step) => step.action !== "summary" && engine.completed.includes(step.id),
    ).length /
      taskCount) *
      100,
  );
  const completedModules = MISSIONS.filter(
    (m) =>
      m.steps.every((s) => engine.completed.includes(s.id)) ||
      (m.steps[0].action === "summary" && progress === 100),
  ).length;
  const resume = () => {
    engine.navigate(engine.stepIndex);
    setView("lesson");
    setOutlineOpen(false);
  };
  function openLesson(id: string) {
    const index = engine.steps.findIndex((step) => step.id === id);
    if (engine.status === "checking" || index < 0) return;
    engine.navigate(index);
    setView("lesson");
    setOutlineOpen(false);
  }
  function openModule(m: Mission) {
    openLesson(m.steps[0].id);
  }
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
    window.scrollTo?.({ top: 0, behavior: "instant" });
  }, [view, engine.stepIndex]);
  return (
    <div className="learning-app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#learn"
          onClick={(event) => {
            event.preventDefault();
            if (engine.status !== "checking") setView("overview");
          }}
        >
          <span className="brand-mark" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span>
            solana<span className="brand-light">learn</span>
          </span>
        </a>
        <nav className="header-tabs" aria-label="Main navigation">
          <button
            aria-current={view === "overview" ? "page" : undefined}
            disabled={engine.status === "checking"}
            onClick={() => setView("overview")}
          >
            Overview
          </button>
          <button
            aria-current={view === "progress" ? "page" : undefined}
            disabled={engine.status === "checking"}
            onClick={() => setView("progress")}
          >
            My progress
          </button>
          <button
            aria-current={view === "scams" ? "page" : undefined}
            disabled={engine.status === "checking"}
            onClick={() => setView("scams")}
          >
            Scam practice
          </button>
        </nav>
        <div className="header-actions">
          <button
            className="glossary-button"
            onClick={() => setGlossaryOpen(true)}
          >
            <Icon name="book" size={18} />
            <span>Glossary</span>
          </button>
          <WalletMultiButton />
        </div>
      </header>
      <LearnerAccess
        progress={engine.progress}
        busy={engine.status === "checking"}
        restore={(progress) => {
          engine.restoreProgress(progress);
          setView("lesson");
        }}
      />
      <section className="cloud-progress" aria-label="Progress storage">
        <p role="status">{sync.message}</p>
        {(owner !== "anon" || account.learner) && (
          <div className="cloud-progress-actions">
            {sync.status === "conflict" ? (
              <>
                <button
                  disabled={engine.status === "checking"}
                  onClick={() => sync.resolve(true)}
                >
                  Use cloud progress
                </button>
                <button
                  disabled={engine.status === "checking"}
                  onClick={() => sync.resolve(false)}
                >
                  Use this device’s progress
                </button>
              </>
            ) : account.learner ? (
              owner !== "anon" && !account.learner.wallets.includes(owner) ? (
                <button
                  disabled={
                    sync.status === "loading" ||
                    sync.status === "saving" ||
                    engine.status === "checking"
                  }
                  onClick={() => void sync.signIn()}
                >
                  Link this wallet to my learner account
                </button>
              ) : sync.status === "error" ? (
                <button onClick={sync.retry}>Retry cloud sync</button>
              ) : null
            ) : sync.status === "ready" || sync.status === "saving" ? (
              <button
                disabled={sync.status === "saving"}
                onClick={() => void sync.signOut()}
              >
                Sign out of cloud saves
              </button>
            ) : (
              <>
                <button
                  disabled={
                    sync.status === "loading" || engine.status === "checking"
                  }
                  onClick={() => void sync.signIn()}
                >
                  Sign in to save progress
                </button>
                {sync.status === "error" && (
                  <button onClick={sync.retry}>Retry cloud sync</button>
                )}
              </>
            )}
          </div>
        )}
      </section>
      <div className="app-layout">
        <aside
          className={`course-sidebar ${outlineOpen ? "is-open" : ""}`}
          aria-label="Course outline"
        >
          <div className="sidebar-course">
            <span className="eyebrow">YOUR FIRST STEPS</span>
            <h2>Web3 essentials</h2>
            <div className="sidebar-progress">
              <progress
                max="100"
                value={progress}
                aria-label="Course progress"
              />
              <span>{progress}%</span>
            </div>
          </div>
          <nav aria-label="Course modules">
            {MISSIONS.map((mission, index) => {
              const complete =
                mission.steps.every((s) => engine.completed.includes(s.id)) ||
                (mission.steps[0].action === "summary" && progress === 100);
              const active = view === "lesson" && index === engine.missionIndex;
              return (
                <div
                  className={`outline-module ${active ? "active" : ""}`}
                  key={mission.id}
                >
                  <button
                    className="module-button"
                    disabled={engine.status === "checking"}
                    aria-current={active ? "step" : undefined}
                    onClick={() => openModule(mission)}
                  >
                    <span
                      className={`module-icon ${complete ? "complete" : ""}`}
                    >
                      <Icon
                        name={complete ? "check" : mission.icon}
                        size={19}
                      />
                    </span>
                    <span>
                      <strong>{mission.name}</strong>
                      <small>
                        {complete
                          ? "Completed"
                          : `${mission.steps.length} ${mission.steps.length === 1 ? "step" : "steps"}`}
                      </small>
                    </span>
                  </button>
                  {active && mission.steps.length > 1 && (
                    <div className="substeps">
                      {mission.steps.map((step) => {
                        const i = engine.steps.findIndex(
                          (s) => s.id === step.id,
                        );
                        return (
                          <button
                            key={step.id}
                            disabled={engine.status === "checking"}
                            aria-current={
                              i === engine.stepIndex ? "step" : undefined
                            }
                            onClick={() => {
                              engine.navigate(i);
                              setOutlineOpen(false);
                            }}
                          >
                            <span>
                              {engine.completed.includes(step.id) ? "✓" : "·"}
                            </span>
                            {step.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="practice-note">
              <span className="status-dot" />
              <div>
                <strong>A safe place to practice</strong>
                <p>Devnet only. No deposits.</p>
              </div>
            </div>
            {!confirmReset ? (
              <button
                className="text-button"
                onClick={() => setConfirmReset(true)}
              >
                Restart course
              </button>
            ) : (
              <div className="reset-confirm">
                <p>
                  Clear this account’s course progress? If cloud saves are
                  enabled, this also resets the cloud copy after syncing. Your
                  wallet stays unchanged.
                </p>
                <button
                  className="text-button"
                  disabled={engine.status === "checking"}
                  onClick={() => {
                    engine.restart();
                    setConfirmReset(false);
                    setView("overview");
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
        <main className={`course-main view-${view}`} id="main-content">
          <button
            className="outline-toggle"
            aria-expanded={outlineOpen}
            onClick={() => setOutlineOpen(!outlineOpen)}
          >
            <Icon name={outlineOpen ? "close" : "menu"} size={18} />
            {outlineOpen ? "Close course outline" : "Course outline"}
            <span>{progress}% complete</span>
          </button>
          {engine.storageFailed && (
            <p className="feedback warning" role="status">
              This browser could not save progress. You can keep learning, but
              your place may be lost after refreshing.
            </p>
          )}
          {view === "overview" ? (
            <Overview
              engine={engine}
              heading={heading}
              progress={progress}
              completedModules={completedModules}
              resume={resume}
              openModule={openModule}
              openLesson={openLesson}
              openScams={() => setView("scams")}
            />
          ) : view === "scams" ? (
            <ScamPractice heading={heading} />
          ) : view === "progress" ? (
            <ProgressView
              engine={engine}
              heading={heading}
              progress={progress}
              resume={resume}
            />
          ) : (
            <Lesson engine={engine} heading={heading} progress={progress} />
          )}
          <footer className="page-footer">
            <span>Understand the action. Then make your move.</span>
            <span>
              <span className="status-dot" />
              Practice on Solana Devnet
            </span>
          </footer>
        </main>
      </div>
      <Celebration completed={engine.completed} />
      {glossaryOpen && <Glossary onClose={() => setGlossaryOpen(false)} />}
    </div>
  );
}
type HeadingRef = RefObject<HTMLHeadingElement | null>;
function Overview({
  engine,
  heading,
  progress,
  completedModules,
  resume,
  openModule,
  openLesson,
  openScams,
}: {
  engine: MissionEngine;
  heading: HeadingRef;
  progress: number;
  completedModules: number;
  resume: () => void;
  openModule: (m: Mission) => void;
  openLesson: (id: string) => void;
  openScams: () => void;
}) {
  return (
    <div className="overview-content">
      <div className="overview-kicker">
        <span className="soft-pill">
          <span className="status-dot" />
          Free, hands-on learning
        </span>
        <span>Built for your very first time.</span>
      </div>
      <section className="overview-hero">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            Understand Web3. Practice Solana. Spot the risk.
          </h1>
          <p>
            A beginner learning platform that connects clear explanations, a
            real Devnet transaction, and safe scam simulations. Learn what an
            action means before you approve it.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={resume}>
              {engine.completed.length || engine.stepIndex > 0
                ? "Continue learning"
                : "Start from the beginning"}
              <Icon name="arrow" size={18} />
            </button>
            <span>
              <Icon name="clock" size={16} />
              Every module is open · Explore at your own pace
            </span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/illustrations/course-wallet.webp"
            alt=""
            width="400"
            height="225"
          />
          <span>
            Small steps.
            <br />
            Useful skills.
          </span>
        </div>
      </section>
      <PlatformOverview openScams={openScams} openLesson={openLesson} />
      <div className="learning-benefits">
        <div>
          <span className="benefit-icon">
            <Icon name="book" />
          </span>
          <div>
            <strong>Make sense of it</strong>
            <p>Plain explanations. Less jargon.</p>
          </div>
        </div>
        <div>
          <span className="benefit-icon blue">
            <Icon name="activity" />
          </span>
          <div>
            <strong>Try, don’t just read</strong>
            <p>Small experiments and real practice.</p>
          </div>
        </div>
        <div>
          <span className="benefit-icon amber">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Learn without a deposit</strong>
            <p>Simulations and free test funds.</p>
          </div>
        </div>
      </div>
      <section className="path-section" aria-labelledby="path-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE BEGINNER PATH</span>
            <h2 id="path-title">Choose any module. Follow your curiosity.</h2>
          </div>
          <span>
            {completedModules} / {MISSIONS.length} modules
          </span>
        </div>
        <div className="module-grid">
          {MISSIONS.map((mission, index) => {
            const complete =
              mission.steps.every((s) => engine.completed.includes(s.id)) ||
              (mission.steps[0].action === "summary" && progress === 100);
            const nextIncomplete = engine.steps.find(
              (step) =>
                step.action !== "summary" &&
                !engine.completed.includes(step.id),
            );
            const suggested = mission.steps.some(
              (step) => step.id === nextIncomplete?.id,
            );
            return (
              <button
                key={mission.id}
                className={`course-card ${suggested && !complete ? "next-card" : ""}`}
                disabled={engine.status === "checking"}
                onClick={() => openModule(mission)}
              >
                <img
                  className="chapter-art"
                  src={chapterArtwork(index)}
                  alt=""
                  width="400"
                  height="160"
                  loading="lazy"
                />
                <div className={`card-symbol tone-${index % 4}`}>
                  <Icon name={mission.icon} size={23} />
                </div>
                <div className="card-content">
                  <div className="card-metadata">
                    <span>MODULE {String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <Icon name="clock" size={13} />
                      {mission.minutes} min
                    </span>
                  </div>
                  <h3>{mission.name}</h3>
                  <p>{mission.description}</p>
                  <span className={`card-state ${complete ? "done" : ""}`}>
                    {complete ? (
                      <>
                        <Icon name="check" size={14} />
                        Completed · Review
                      </>
                    ) : (
                      <>
                        {suggested ? "Suggested next" : "Explore module"}
                        <Icon name="arrow" size={14} />
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <div className="course-reassurance">
        <Icon name="info" size={19} />
        <p>
          Explore every module and lesson without completing prerequisites.
          Wallet actions still require your approval and Devnet setup. Visiting
          a lesson does not mark it complete.
        </p>
      </div>
    </div>
  );
}
function Lesson({
  engine,
  heading,
  progress,
}: {
  engine: MissionEngine;
  heading: HeadingRef;
  progress: number;
}) {
  const { step, stepIndex } = engine;
  return (
    <div className="lesson-page">
      <div className="breadcrumb">
        <span>Web3 essentials</span>
        <Icon name="chevron" size={13} />
        <span>{engine.mission.name}</span>
      </div>
      <div className="lesson-layout">
        <article className="lesson-content" key={step.id}>
          <div className="lesson-meta">
            <span className="soft-pill">
              Module {String(engine.missionIndex + 1).padStart(2, "0")}
            </span>
            <span>
              {engine.mission.steps.findIndex((s) => s.id === step.id) + 1} of{" "}
              {engine.mission.steps.length} steps
            </span>
          </div>
          <h1 ref={heading} tabIndex={-1}>
            {step.title}
          </h1>
          <p className="lesson-objective">{step.objective}</p>
          {step.scamScenario ? (
            <ScamLesson key={step.id} scenarioId={step.scamScenario} />
          ) : (
            <LessonScene key={`scene-${step.id}`} step={step} />
          )}
          <LessonExplanation key={`explanation-${step.id}`} step={step} />
          {step.diagram && !step.scamScenario && (
            <details className="extra-experiment">
              <summary>Explore another example</summary>
              <LearningVisual kind={step.diagram} />
            </details>
          )}
          {step.instructions.length > 0 && (
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
                {step.instructions.map((text, index) => (
                  <li key={text}>
                    <span className="instruction-number" aria-hidden>
                      {index + 1}
                    </span>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {step.safety && (
            <aside className="safety-note">
              <Icon name="shield" size={21} />
              <div>
                <strong>Keep this in mind</strong>
                <p>{step.safety}</p>
              </div>
            </aside>
          )}
          <ActionZone engine={engine} />
          {step.action !== "quiz" && (
            <section className="expected-result">
              <Icon name="check" size={19} />
              <div>
                <h2>What to expect</h2>
                <p>{step.expected}</p>
              </div>
            </section>
          )}
          <div className="lesson-details">
            {step.terms.length > 0 && (
              <details>
                <summary>
                  <span>
                    <Icon name="book" size={17} />A little less jargon
                  </span>
                  <span aria-hidden>+</span>
                </summary>
                <dl>
                  {step.terms.map((t) => (
                    <div key={t.term}>
                      <dt>{t.term}</dt>
                      <dd>{t.definition}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
            <details>
              <summary>
                <span>
                  <Icon name="info" size={17} />
                  {step.action === "quiz" ? "Need a hint?" : "Having trouble?"}
                </span>
                <span aria-hidden>+</span>
              </summary>
              <p>{step.troubleshooting}</p>
            </details>
          </div>
          {step.source && (
            <div className="lesson-source">
              <span>Keep exploring</span>
              <a href={step.source.href} target="_blank" rel="noreferrer">
                {step.source.label}
                <Icon name="external" size={14} />
              </a>
            </div>
          )}
          <footer className="lesson-navigation">
            <button
              className="button button-quiet"
              disabled={stepIndex === 0 || engine.status === "checking"}
              onClick={engine.goBack}
            >
              <Icon name="back" size={17} />
              Back
            </button>
            <span>
              {engine.passed
                ? "Check complete."
                : "Browse freely. This step stays incomplete until its check is done."}
            </span>
            {step.action !== "summary" && (
              <button
                className="button button-primary"
                disabled={!engine.canGoNext || engine.status === "checking"}
                onClick={engine.goNext}
              >
                {stepIndex === engine.steps.length - 2
                  ? "Review your progress"
                  : engine.passed
                    ? "Continue"
                    : "Next lesson"}
                <Icon name="arrow" size={17} />
              </button>
            )}
          </footer>
        </article>
        <aside className="lesson-rail">
          <div className="rail-card">
            <span className="eyebrow">YOU’RE LEARNING</span>
            <span className="rail-icon">
              <Icon name={engine.mission.icon} size={24} />
            </span>
            <h3>{engine.mission.name}</h3>
            <p>{engine.mission.description}</p>
            <div className="rail-progress">
              <progress
                max="100"
                value={progress}
                aria-label="Overall completion"
              />
              <span>{progress}% of the course</span>
            </div>
          </div>
          <div className="rail-note">
            <Icon name="shield" size={17} />
            <p>
              {step.scamScenario
                ? "Preview mode is simulated. Optional live exercises are clearly marked and require wallet approval. Learning checks stay separate."
                : step.action === "quiz"
                  ? "Make a choice. Get feedback. Try again. No wallet requests in these learning checks."
                  : "Keep your recovery phrase private. This course never needs to see it."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function ProgressView({
  engine,
  heading,
  progress,
  resume,
}: {
  engine: MissionEngine;
  heading: HeadingRef;
  progress: number;
  resume: () => void;
}) {
  return (
    <div className="progress-page">
      <span className="eyebrow">YOUR LEARNING RECORD</span>
      <h1 ref={heading} tabIndex={-1}>
        Look how far you’ve come.
      </h1>
      <p>
        Progress saves in this browser. Sign in with your wallet to sync it
        across devices. This is a record of practice, not a certification.
      </p>
      <div className="progress-stat">
        <strong>
          {progress}
          <span>%</span>
        </strong>
        <div>
          <h2>
            {Math.min(engine.completed.length, engine.steps.length - 1)} steps
            completed
          </h2>
          <p>Every small step adds up.</p>
        </div>
        <button className="button button-primary" onClick={resume}>
          Keep learning
          <Icon name="arrow" size={16} />
        </button>
      </div>
      <div className="progress-modules">
        {MISSIONS.map((m) => {
          const count = m.steps.filter((s) =>
            engine.completed.includes(s.id),
          ).length;
          return (
            <div key={m.id}>
              <span className="card-symbol">
                <Icon name={m.icon} />
              </span>
              <div>
                <h3>{m.name}</h3>
                <p>
                  {m.steps[0].action === "summary"
                    ? progress === 100
                      ? "Ready to review"
                      : "Coming up"
                    : `${count} of ${m.steps.length} steps`}
                </p>
              </div>
              <Icon
                name={
                  count === m.steps.length ||
                  (m.steps[0].action === "summary" && progress === 100)
                    ? "check"
                    : "clock"
                }
                size={18}
              />
            </div>
          );
        })}
      </div>
      <aside className="verification-note">
        <h2>What this record means</h2>
        <p>
          Learning checks run locally. Wallet creation, backup, and wallet
          network settings are self-confirmed. Connection is checked through
          your wallet, balances and execution through Devnet RPC, and the public
          exercise code is checked locally. Cloud sync verifies wallet
          ownership; it does not independently verify lesson completion.
        </p>
      </aside>
    </div>
  );
}
