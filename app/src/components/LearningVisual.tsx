import { useState } from "react";
import type { DiagramKind } from "../content/missions";
import { Icon } from "./Icon";

export function LearningVisual({ kind }: { kind: DiagramKind }) {
  if (kind === "records") return <RecordComparison />;
  if (kind === "journey" || kind === "receipt")
    return <TransactionJourney receipt={kind === "receipt"} />;
  if (kind === "networks") return <NetworkComparison />;
  if (kind === "uses") return <UseCases />;
  if (kind === "fees") return <FeeLab />;
  if (kind === "airdrop" || kind === "support" || kind === "approval")
    return <ScamScene kind={kind} />;
  return <WalletAnatomy kind={kind} />;
}
function RecordComparison() {
  const [shared, setShared] = useState(false);
  return (
    <section
      className="visual-lab"
      aria-label="Explore how records are managed"
    >
      <div className="lab-top">
        <span>
          <Icon name="layers" size={17} /> A simple mental model
        </span>
        <div className="segmented" aria-label="Record model">
          <button aria-pressed={!shared} onClick={() => setShared(false)}>
            One company
          </button>
          <button aria-pressed={shared} onClick={() => setShared(true)}>
            Shared network
          </button>
        </div>
      </div>
      <div className={`record-diagram ${shared ? "shared" : ""}`}>
        <svg
          className="record-links"
          viewBox="0 0 600 140"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={
              shared
                ? "M100 70H300H500M100 70L300 15L500 70L300 125Z M300 15V125"
                : "M100 70H300H500"
            }
          />
        </svg>
        <div className="diagram-node">
          <Icon name={shared ? "book" : "wallet"} size={24} />
          <strong>{shared ? "Node A" : "You"}</strong>
          <small>{shared ? "Checks records" : "Sends a request"}</small>
        </div>
        <div
          className={`diagram-node center-node ${shared ? "" : "company-node"}`}
        >
          <Icon name={shared ? "book" : "layers"} size={27} />
          <strong>{shared ? "Node B" : "Company"}</strong>
          <small>{shared ? "Checks records" : "Runs the database"}</small>
        </div>
        <div className="diagram-node">
          <Icon name={shared ? "book" : "wallet"} size={24} />
          <strong>{shared ? "Node C" : "A friend"}</strong>
          <small>{shared ? "Checks records" : "Uses the same app"}</small>
        </div>
      </div>
      <div className="lab-explanation" role="status">
        <strong>
          {shared
            ? "Independent participants follow shared rules."
            : "One operator manages the record."}
        </strong>
        <p>
          {shared
            ? "The network checks proposed changes. There is no single company-owned database in this simplified model—but apps can still depend on central services."
            : "This can be simple and efficient. You also rely on the operator for access, changes, and account recovery."}
        </p>
      </div>
    </section>
  );
}
const NETWORKS = [
  {
    name: "Solana",
    asset: "SOL",
    focus: "Programs and assets on one base network",
    detail:
      "Independent account access can run in parallel. Shared account access still needs coordination.",
    tradeoff: "Validator hardware, network availability, application risk.",
    source: "https://solana.com/docs/references/terminology",
  },
  {
    name: "Ethereum",
    asset: "ETH",
    focus: "Programmable base network with a rollup ecosystem",
    detail:
      "Many apps use Ethereum itself; many others operate on separate layer-2 networks.",
    tradeoff:
      "Base-layer fees vary. Moving to another network adds compatibility checks.",
    source: "https://ethereum.org/roadmap/scaling/",
  },
  {
    name: "Base (L2)",
    asset: "ETH",
    focus: "An Ethereum layer-2 network",
    detail:
      "A separate network that posts data to Ethereum. An Ethereum address can look the same on Base while its balance differs.",
    tradeoff:
      "Sequencer, upgrade, and bridge assumptions differ from the base layer.",
    source: "https://ethereum.org/layer-2/",
  },
  {
    name: "Bitcoin",
    asset: "BTC",
    focus: "A payment ledger and native monetary asset",
    detail:
      "Bitcoin’s original proposal focused on peer-to-peer electronic cash without a financial intermediary.",
    tradeoff:
      "Its base layer has a different scripting model and design priorities.",
    source: "https://bitcoin.org/bitcoin.pdf",
  },
];
function NetworkComparison() {
  const [selected, setSelected] = useState(0);
  const network = NETWORKS[selected];
  return (
    <section className="visual-lab" aria-label="Compare blockchain networks">
      <div className="lab-top">
        <span>
          <Icon name="globe" size={17} /> Same idea. Different networks.
        </span>
      </div>
      <div className="network-tabs" aria-label="Choose a network">
        {NETWORKS.map((n, i) => (
          <button
            key={n.name}
            aria-pressed={i === selected}
            onClick={() => setSelected(i)}
          >
            <span className={`network-dot network-${i}`} />
            {n.name}
          </button>
        ))}
      </div>
      <div className="network-details" key={network.name}>
        <div className="network-title">
          <div>
            <span className="eyebrow">NETWORK</span>
            <h3>{network.name}</h3>
          </div>
          <span className="fee-asset">
            <Icon name="coins" />
            Fee asset <strong>{network.asset}</strong>
          </span>
        </div>
        <dl>
          <div>
            <dt>Designed around</dt>
            <dd>{network.focus}</dd>
          </div>
          <div>
            <dt>What’s different</dt>
            <dd>{network.detail}</dd>
          </div>
          <div>
            <dt>Consider the tradeoffs</dt>
            <dd>{network.tradeoff}</dd>
          </div>
        </dl>
        <a href={network.source} target="_blank" rel="noreferrer">
          Read the primary source <Icon name="external" size={14} />
        </a>
      </div>
      <p className="lab-footnote">
        No speed leaderboard. Check the network, asset, destination, and costs
        for your actual task.
      </p>
    </section>
  );
}
function TransactionJourney({ receipt }: { receipt: boolean }) {
  const [stage, setStage] = useState(receipt ? 3 : 0);
  const [outcome, setOutcome] = useState<"success" | "failed">("success");
  const stages = [
    {
      name: "Prepare",
      icon: "book",
      text: "The app builds a request: which network, which accounts, what instructions, and who pays the fee. Nothing has been signed yet.",
    },
    {
      name: "Sign",
      icon: "key",
      text: "Your wallet shows the request. Inspect the contents before approving. A signature authorizes the request; it does not guarantee execution.",
    },
    {
      name: "Submit",
      icon: "send",
      text: "The signed request reaches the network. It can be accepted, rejected, or expire. A transaction ID is a lookup reference, not proof of success.",
    },
    {
      name: "Check",
      icon: "search",
      text: "Inspect execution status and the actual changes on the correct network. Fees can be charged even when execution fails.",
    },
  ];
  return (
    <section
      className="visual-lab"
      aria-label="Explore a transaction’s journey"
    >
      <div className="lab-top">
        <span>
          <Icon name="send" size={17} /> Tap a stage to follow the request
        </span>
        <span className="simulation-label">Illustrative</span>
      </div>
      <div className="journey-stages">
        {stages.map((s, i) => (
          <button
            key={s.name}
            aria-pressed={i === stage}
            onClick={() => setStage(i)}
          >
            <span>
              <Icon name={s.icon} size={21} />
            </span>
            <strong>{s.name}</strong>
            {i < 3 && <i aria-hidden>→</i>}
          </button>
        ))}
      </div>
      <div className="lab-explanation" role="status">
        <strong>
          {stage + 1}. {stages[stage].name}
        </strong>
        <p>{stages[stage].text}</p>
      </div>
      {stage === 3 && (
        <div className="outcome-demo">
          <div className="segmented">
            <button
              aria-pressed={outcome === "success"}
              onClick={() => setOutcome("success")}
            >
              Success
            </button>
            <button
              aria-pressed={outcome === "failed"}
              onClick={() => setOutcome("failed")}
            >
              Execution failed
            </button>
          </div>
          <p role="status">
            <Icon name={outcome === "success" ? "check" : "info"} size={17} />
            {outcome === "success"
              ? "Result: successful. Check that the changes match your intent."
              : "Result: error. Requested state changes revert; a processing fee may still be charged."}
          </p>
        </div>
      )}
    </section>
  );
}
function FeeLab() {
  const [funded, setFunded] = useState(false);
  return (
    <section
      className="visual-lab fee-lab"
      aria-label="Simulate a missing network fee"
    >
      <div className="lab-top">
        <span>
          <Icon name="coins" size={17} /> A balance is not the whole picture
        </span>
        <span className="simulation-label">Simulation · no funds move</span>
      </div>
      <div className="token-row">
        <span className="token-icon dollar">$</span>
        <div>
          <strong>USDC</strong>
          <small>Asset you want to send</small>
        </div>
        <strong>10.00</strong>
      </div>
      <div className="token-row">
        <span className="token-icon sol">≋</span>
        <div>
          <strong>Devnet SOL</strong>
          <small>Pays the network fee</small>
        </div>
        <strong>{funded ? "0.01" : "0.00"}</strong>
      </div>
      <div className={`fee-outcome ${funded ? "is-ready" : ""}`} role="status">
        <Icon name={funded ? "check" : "info"} size={18} />
        <p>
          {funded
            ? "Fee balance added in the simulation. Now the request can be prepared; execution is still a separate check."
            : "The USDC balance is sufficient for a small token payment, but the ordinary fee payer has no SOL."}
        </p>
      </div>
      <button
        className="button button-secondary"
        onClick={() => setFunded(!funded)}
      >
        {funded ? "Reset the example" : "Add simulated test SOL"}
        <Icon name="arrow" size={16} />
      </button>
    </section>
  );
}
const USES = [
  {
    name: "Payments",
    icon: "send",
    example: "Send a stablecoin to another account",
    detail:
      "The network records the transfer. Exchange cash-out, issuer redemption, and legal protections depend on the services and asset.",
    tag: "Network + issuer risk",
  },
  {
    name: "Trading & DeFi",
    icon: "activity",
    example: "Swap a token through a program",
    detail:
      "The program may execute trades or loans, but price changes, contract bugs, and scams can cause losses. No trading is needed in this course.",
    tag: "Financial + program risk",
  },
  {
    name: "Collectibles",
    icon: "layers",
    example: "Hold a distinct digital token",
    detail:
      "A network can record a token’s account association. Copyright, useful access, and real-world rights must be checked separately.",
    tag: "Verify rights + authenticity",
  },
  {
    name: "App access",
    icon: "key",
    example: "Use a wallet to prove account control",
    detail:
      "An app can verify a signature or token holding. It still decides what that proof unlocks; do not sign a message you cannot explain.",
    tag: "Review every request",
  },
];
function UseCases() {
  const [selected, setSelected] = useState(0);
  const item = USES[selected];
  return (
    <section className="visual-lab" aria-label="Explore common Web3 uses">
      <div className="lab-top">
        <span>
          <Icon name="globe" size={17} /> Product categories, not investment
          advice
        </span>
      </div>
      <div className="usecase-tabs">
        {USES.map((u, i) => (
          <button
            key={u.name}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <Icon name={u.icon} size={20} />
            {u.name}
          </button>
        ))}
      </div>
      <div className="usecase-detail" role="status">
        <span className="subtle-tag">{item.tag}</span>
        <h3>{item.example}</h3>
        <p>{item.detail}</p>
      </div>
    </section>
  );
}
function WalletAnatomy({ kind }: { kind: DiagramKind }) {
  const [selected, setSelected] = useState<"address" | "keys" | "connection">(
    "address",
  );
  const details = {
    address: {
      title: "Public address",
      text: "Share it to receive funds on the correct network. It can reveal public activity, but it does not let someone sign for you.",
    },
    keys: {
      title: "Recovery secrets",
      text: "Keep private keys and recovery phrases private. Anyone with them may control your accounts. The app password is a separate device-level protection.",
    },
    connection: {
      title: "Connection permission",
      text: "The site learns your public account and may request actions. Connection itself is not permission to transfer funds. Review later requests separately.",
    },
  };
  return (
    <section
      className="visual-lab wallet-anatomy"
      aria-label="Explore your wallet"
    >
      <div className="lab-top">
        <span>
          <Icon name="wallet" size={17} /> Your wallet is a control panel
        </span>
        <span className="simulation-label">Illustration</span>
      </div>
      <div className="wallet-explainer">
        <img
          src="/illustrations/wallet-keys.png"
          alt=""
          className="small-illustration"
          width="96"
          height="96"
        />
        <div>
          <h3>
            Keys in your wallet.
            <br />
            Records on the network.
          </h3>
          <p>Explore what each part does.</p>
        </div>
      </div>
      <div className="anatomy-controls">
        {(["address", "keys", "connection"] as const).map((key) => (
          <button
            key={key}
            aria-pressed={selected === key}
            onClick={() => setSelected(key)}
          >
            <Icon
              name={
                key === "address" ? "wallet" : key === "keys" ? "key" : "globe"
              }
              size={18}
            />
            {key === "address"
              ? "Public address"
              : key === "keys"
                ? "Private keys"
                : "Connection"}
          </button>
        ))}
      </div>
      <div className="lab-explanation" role="status">
        <strong>
          {kind === "permissions" && selected === "address"
            ? "Start with the address you share"
            : details[selected].title}
        </strong>
        <p>{details[selected].text}</p>
      </div>
    </section>
  );
}
function ScamScene({ kind }: { kind: "airdrop" | "support" | "approval" }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <section
      className="visual-lab scam-scene"
      aria-label="Simulated suspicious request"
    >
      <div className="lab-top">
        <span>
          <Icon name="shield" size={17} /> Inspect the scenario
        </span>
        <span className="simulation-label">Simulation · no wallet request</span>
      </div>
      {kind === "airdrop" ? (
        <div className="fake-message">
          <span className="message-avatar">
            <Icon name="spark" size={23} />
          </span>
          <div>
            <strong>A reward just arrived!</strong>
            <p>You received 10 SOL. Claim within 5 minutes.</p>
            <code>sol-rewards.example</code>
            <small>A non-working training address</small>
          </div>
        </div>
      ) : kind === "support" ? (
        <div className="chat-demo">
          <div className="chat-line">
            <span>Support</span>
            <p>I can explain why you need SOL for the network fee.</p>
          </div>
          <div className="chat-line you">
            <span>You</span>
            <p>Thanks. My wallet still isn’t working.</p>
          </div>
          <div className="chat-line suspicious">
            <span>Support</span>
            <p>
              Synchronize it on this new site. Enter your recovery phrase and
              I’ll fix it.
            </p>
          </div>
        </div>
      ) : (
        <div className="request-demo">
          <div>
            <Icon name="wallet" />
            <strong>Review request</strong>
            <span>Simulated</span>
          </div>
          <dl>
            <div>
              <dt>Page promises</dt>
              <dd>Claim a free badge</dd>
            </div>
            <div>
              <dt>Requested action</dt>
              <dd className="risk-text">Send 0.5 SOL</dd>
            </div>
            <div>
              <dt>Recipient</dt>
              <dd>Unfamiliar account</dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>Solana Devnet</dd>
            </div>
          </dl>
          <p>No signing request is sent. This is a training example.</p>
        </div>
      )}
      <button
        className="text-button reveal-button"
        aria-expanded={revealed}
        onClick={() => setRevealed(!revealed)}
      >
        <Icon name="search" size={16} />
        {revealed ? "Hide the clue" : "Show me a clue"}
      </button>
      {revealed && (
        <div className="lab-explanation" role="status">
          <strong>
            {kind === "airdrop"
              ? "Appearance is not endorsement."
              : kind === "support"
                ? "Evaluate the access requested."
                : "Compare the promise with the effect."}
          </strong>
          <p>
            {kind === "airdrop"
              ? "A token or message can appear in your wallet without being approved by the wallet provider. Urgency and unfamiliar links deserve scrutiny."
              : kind === "support"
                ? "Helpful earlier messages do not make a recovery-phrase request safe. No support agent needs your recovery secrets."
                : "A “free” label does not change what you sign. An unexpected asset transfer is a reason to stop."}
          </p>
        </div>
      )}
    </section>
  );
}
