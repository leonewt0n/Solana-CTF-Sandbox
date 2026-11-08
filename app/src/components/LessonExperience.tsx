import { useId, useState } from "react";
import type { Step } from "../content/missions";
import { Icon } from "./Icon";

const sceneArtwork: Record<string, string> = {
  records: "shared-records",
  uses: "shared-records",
  networks: "shared-records",
  wallet: "course-wallet",
  fees: "transaction-receipt",
  journey: "transaction-receipt",
  receipt: "transaction-receipt",
};
type Scene = { title: string; caption: string; cards: [string, string][] };
const scenes: Record<string, Scene[]> = {
  records: [
    {
      title: "One place keeps the record",
      caption:
        "An app can be convenient because one operator manages access and updates.",
      cards: [
        ["You", "Request a change"],
        ["Operator", "Stores the record"],
        ["Another app", "Needs access"],
      ],
    },
    {
      title: "A record others can check",
      caption:
        "Independent participants check proposed changes against shared rules. Applications can still rely on central services.",
      cards: [
        ["Participant A", "Checks shared rules"],
        ["Participant B", "Checks shared rules"],
        ["Participant C", "Checks shared rules"],
      ],
    },
    {
      title: "Control comes with responsibility",
      caption:
        "A public record does not guarantee privacy, recovery, or that another app will support an asset.",
      cards: [
        ["Public activity", "Others may inspect it"],
        ["Your keys", "Protect your access"],
        ["App support", "Still varies"],
      ],
    },
  ],
  wallet: [
    {
      title: "An address is for sharing",
      caption:
        "A wallet manages keys and helps you interact with accounts. Assets are recorded on the network, not inside this picture.",
      cards: [
        ["Practice wallet", "Devnet · illustrative"],
        ["Public address", "Share to receive"],
        ["Network record", "Tracks accounts and assets"],
      ],
    },
    {
      title: "Recovery stays private",
      caption:
        "Recovery words can restore control of accounts. Never enter them into a website or share them with support.",
      cards: [
        ["Public address", "Safe to share"],
        ["Recovery words", "Never displayed here"],
        ["Private key", "Keep private"],
      ],
    },
    {
      title: "Connection is one permission",
      caption:
        "Connecting can share your public address. Signing a message or transaction is a separate request that needs review.",
      cards: [
        ["Connect", "Share an address"],
        ["Sign a message", "Review its meaning"],
        ["Sign a transaction", "Review instructions and fees"],
      ],
    },
  ],
  networks: [
    {
      title: "Same wallet, different network",
      caption:
        "A network selection changes which accounts, assets, and transactions you are inspecting.",
      cards: [
        ["Mainnet", "Real economic value"],
        ["Devnet", "Practice environment"],
        ["This course", "Uses Solana Devnet"],
      ],
    },
    {
      title: "Test funds are for practice",
      caption:
        "Devnet SOL is used to test actions. It is separate from Mainnet SOL and should not be bought for this course.",
      cards: [
        ["Faucet", "Request test SOL"],
        ["Practice account", "Receive on Devnet"],
        ["Network fee", "Paid in test SOL"],
      ],
    },
  ],
  fees: [
    {
      title: "A transaction needs a fee payer",
      caption:
        "The fee payer needs SOL on the same network. Owning another token does not by itself pay a Solana transaction fee.",
      cards: [
        ["Token balance", "Not the fee balance"],
        ["SOL balance", "Pays network fees"],
        ["Fee estimate", "Review before signing"],
      ],
    },
    {
      title: "Execution and fees are different",
      caption:
        "A transaction that reaches the network and fails execution can still incur fees. Declining in your wallet does not submit it.",
      cards: [
        ["Declined", "Not submitted"],
        ["Executed", "Inspect the result"],
        ["Failed execution", "Can still cost a fee"],
      ],
    },
  ],
  journey: [
    {
      title: "01 · Assemble",
      caption:
        "The application prepares instructions and selects a network. Nothing has been signed or submitted yet.",
      cards: [
        ["Network", "Solana Devnet"],
        ["Instruction", "Call teaching program"],
        ["Fee payer", "Practice account"],
      ],
    },
    {
      title: "02 · Review and sign",
      caption:
        "Your wallet asks for approval. Check what is requested before signing; a signature alone is not a confirmed receipt.",
      cards: [
        ["Requested action", "Review instructions"],
        ["Estimated fee", "Review in wallet"],
        ["Your decision", "Approve or decline"],
      ],
    },
    {
      title: "03 · Submit",
      caption:
        "The signed transaction is sent to the network. A submission identifier is not proof of successful execution.",
      cards: [
        ["Signed transaction", "Sent through RPC"],
        ["Network", "Processes the request"],
        ["Status", "Check confirmation"],
      ],
    },
    {
      title: "04 · Inspect the result",
      caption:
        "Check confirmation and execution status, then inspect fees and program logs. This visual never sends a transaction.",
      cards: [
        ["Confirmation", "Check the network"],
        ["Execution", "Success or error"],
        ["Program logs", "Explain what ran"],
      ],
    },
  ],
  receipt: [
    {
      title: "A receipt tells a story",
      caption:
        "Start with the network and signature. This illustrative receipt is not a live transaction.",
      cards: [
        ["Network", "Solana Devnet"],
        ["Signature", "Illustrative receipt"],
        ["Execution status", "Inspect success or error"],
      ],
    },
    {
      title: "Follow the cost and the call",
      caption:
        "The fee and invoked program explain more than a green status badge alone.",
      cards: [
        ["Fee", "Paid by the fee payer"],
        ["Program", "The code invoked"],
        ["Instructions", "What was requested"],
      ],
    },
    {
      title: "Read the logs",
      caption:
        "Program logs can explain execution. The teaching exercise puts a public practice code in its logs; it is not a secret or credential.",
      cards: [
        ["Program invoked", "Execution begins"],
        ["Program log", "Teaching output"],
        ["Execution result", "Inspect final status"],
      ],
    },
  ],
  uses: [
    {
      title: "A shared record, different uses",
      caption:
        "Apps can use a public network for transfers, ownership records, or shared rules. They still need useful interfaces and supported assets.",
      cards: [
        ["Transfers", "Move a supported asset"],
        ["Ownership", "Check a public record"],
        ["Programs", "Run shared rules"],
      ],
    },
    {
      title: "Choose the tool for the job",
      caption:
        "Public activity, fees, recovery, and application dependencies are tradeoffs. Not every app needs a blockchain.",
      cards: [
        ["Privacy", "What becomes public?"],
        ["Recovery", "Who can restore access?"],
        ["Dependencies", "What must keep working?"],
      ],
    },
  ],
};
function sceneKind(step: Step) {
  if (step.action === "summary") return "journey";
  if (step.action === "explorer" || step.action === "flag") return "receipt";
  if (step.action === "transaction") return "journey";
  if (step.action === "faucet") return "networks";
  if (step.diagram && scenes[step.diagram]) return step.diagram;
  return "wallet";
}

/** A local visual walkthrough. Scene controls never call a wallet or award course credit. */
export function LessonScene({ step }: { step: Step }) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const kind = sceneKind(step);
  const frames = scenes[kind];
  const frame = frames[index];
  return (
    <section
      className={`lesson-scene scene-${kind}`}
      aria-label="Visual walkthrough"
    >
      <div className="scene-topline">
        <span className="eyebrow">EXPLORE THE IDEA</span>
        <span>Illustrative · no wallet action</span>
      </div>
      <div className="scene-art">
        <img
          src={`/illustrations/${sceneArtwork[kind]}.webp`}
          alt=""
          width="1200"
          height="675"
        />
      </div>
      <div
        className="scene-tabs"
        role="group"
        aria-label="Choose a visual stage"
      >
        {frames.map((item, i) => (
          <button
            key={item.title}
            aria-pressed={i === index}
            aria-controls={id}
            onClick={() => setIndex(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {item.title.replace(/^\d+ · /, "")}
          </button>
        ))}
      </div>
      <div id={id} className="scene-frame" key={frame.title}>
        {kind === "journey" && (
          <div
            className="transaction-track"
            aria-label={`Transaction walkthrough stage ${index + 1} of ${frames.length}`}
          >
            {frames.map((item, i) => (
              <div
                key={item.title}
                className={i <= index ? "track-reached" : ""}
              >
                <span>{i < index ? "✓" : i + 1}</span>
                <small>{["Assemble", "Review", "Submit", "Inspect"][i]}</small>
              </div>
            ))}
          </div>
        )}
        {kind === "receipt" && (
          <div
            className="receipt-preview"
            aria-label="Illustrative receipt fields"
          >
            <div className="receipt-preview-heading">
              <span>TRANSACTION RECEIPT</span>
              <span>ILLUSTRATIVE</span>
            </div>
            {[
              ["Network", "Solana Devnet"],
              ["Execution", "Check success or error"],
              ["Fee / program", "Inspect in Explorer"],
              ["Program logs", "Read the output"],
            ].map(([label, value], i) => (
              <div
                key={label}
                className={
                  (index === 0 && i < 2) ||
                  (index === 1 && i === 2) ||
                  (index === 2 && i === 3)
                    ? "receipt-highlight"
                    : ""
                }
              >
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
        <div className="scene-card-stack">
          {frame.cards.map(([label, value], i) => (
            <div key={label} className={`scene-object scene-object-${i}`}>
              <span className="scene-card-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <strong>{label}</strong>
              <span>{value}</span>
              <div className="scene-card-lines" aria-hidden>
                <i />
                <i />
                <i />
              </div>
            </div>
          ))}
        </div>
        <div className="scene-caption" aria-live="polite">
          <h2>{frame.title}</h2>
          <p>{frame.caption}</p>
        </div>
      </div>
      <div className="scene-controls">
        <button
          className="text-button"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Previous scene
        </button>
        <span>
          {index + 1} / {frames.length}
        </span>
        <button
          className="text-button"
          disabled={index === frames.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Next scene <Icon name="arrow" size={14} />
        </button>
      </div>
    </section>
  );
}

export function LessonExplanation({ step }: { step: Step }) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const pages = [step.why, ...(step.explanation ?? [])];
  return (
    <section className="explanation-deck" aria-label="Concept explained">
      <div className="explanation-heading">
        <span className="eyebrow">THE IDEA, IN SMALL STEPS</span>
        <span>
          {index + 1} / {pages.length}
        </span>
      </div>
      <div className="explanation-page" key={index} id={id} aria-live="polite">
        <h2>{index === 0 ? "Start here" : `A closer look · ${index}`}</h2>
        <p>{pages[index]}</p>
      </div>
      {pages.length > 1 && (
        <div className="explanation-controls">
          <button
            className="text-button"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            aria-controls={id}
          >
            Previous explanation
          </button>
          <div className="page-dots" aria-label="Explanation pages">
            {pages.map((_, i) => (
              <button
                key={i}
                aria-label={`Explanation ${i + 1}`}
                aria-pressed={index === i}
                aria-controls={id}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            className="text-button"
            disabled={index === pages.length - 1}
            onClick={() => setIndex(index + 1)}
            aria-controls={id}
          >
            Next explanation
          </button>
        </div>
      )}
      <details className="full-explanation">
        <summary>Read the full explanation</summary>
        {pages.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </details>
    </section>
  );
}
