import { MISSIONS } from "../content/missions";
import { SCAM_SCENARIOS } from "../content/scams";
import { explorerProgramUrl } from "../lib/constants";
import { Icon } from "./Icon";

export function PlatformOverview({
  openScams,
  openLesson,
}: {
  openScams: () => void;
  openLesson: (id: string) => void;
}) {
  return (
    <section
      className="platform-overview"
      aria-labelledby="platform-overview-title"
    >
      <div className="platform-overview-intro">
        <span className="eyebrow">THE PLATFORM IN ABOUT A MINUTE</span>
        <h2 id="platform-overview-title">
          From understanding an idea to checking what you approve.
        </h2>
        <p>
          Crypto onboarding often jumps from unfamiliar words straight to a
          wallet request. Solana Learn connects the missing pieces: clear
          concepts, a real transaction you can inspect, and a safe place to
          rehearse risky decisions.
        </p>
        <div className="overview-facts">
          <span>{MISSIONS.length} open modules</span>
          <span>{MISSIONS.flatMap((m) => m.steps).length} lessons</span>
          <span>{SCAM_SCENARIOS.length} scam simulations</span>
        </div>
      </div>
      <div className="overview-workflow">
        <div>
          <Icon name="book" />
          <h3>Understand the foundations</h3>
          <p>
            Interactive diagrams and short checks explain Web3, blockchain
            records, Solana, wallets, and fees before asking you to use them.
          </p>
        </div>
        <div>
          <Icon name="send" />
          <h3>Follow a real Solana action</h3>
          <p>
            Prepare a practice wallet, use free Devnet test SOL, call the
            teaching program, and inspect its public exercise code in Explorer
            logs.
          </p>
        </div>
        <div>
          <Icon name="shield" />
          <h3>Rehearse the risky moments</h3>
          <p>
            Compare messages, recipients, token permissions, and recovery
            choices in fictional prompts. Scam exercises never ask your wallet
            to sign.
          </p>
        </div>
      </div>
      <div className="reviewer-route">
        <div>
          <span className="eyebrow">HAVE TWO MINUTES?</span>
          <h3>Try the highlights. Skip around freely.</h3>
          <p>
            Every module and lesson is open. Exploring does not require
            finishing earlier checks.
          </p>
        </div>
        <div className="reviewer-shortcuts">
          <button className="button button-primary" onClick={openScams}>
            Try a scam simulation
            <Icon name="arrow" size={16} />
          </button>
          <button
            className="button button-secondary"
            onClick={() => openLesson("5.1")}
          >
            Review the Devnet exercise
          </button>
          <button
            className="button button-secondary"
            onClick={() => openLesson("6.1")}
          >
            Explore the receipt lesson
          </button>
        </div>
      </div>
      <details className="overview-details">
        <summary>What is real, what is simulated, and what gets saved?</summary>
        <p>
          <strong>Real practice:</strong> the wallet and teaching program
          operate on Solana Devnet. Executing the program call requires your
          explicit wallet approval and test SOL for fees. Opening a lesson never
          sends a transaction.
        </p>
        <p>
          <strong>Simulated practice:</strong> scam prompts change only the
          training panel. They collect no recovery words and create no
          signatures, permissions, payments, or installations.
        </p>
        <p>
          <strong>Your learning record:</strong> completed checks and your place
          are saved in the browser. Optional wallet login syncs wallet-specific
          progress through Cloudflare D1; one-time transfer codes carry
          introductory progress into another browser. A learning record is not a
          certification or independently verified credential.
        </p>
        <p>
          <strong>Behind the experience:</strong> a React/TypeScript interface,
          a Rust/Anchor teaching program, and a Cloudflare Worker/D1 progress
          service.
        </p>
        <a
          className="inline-link"
          href={explorerProgramUrl()}
          target="_blank"
          rel="noreferrer"
        >
          View the teaching program on Solana Devnet ↗
        </a>
      </details>
    </section>
  );
}
