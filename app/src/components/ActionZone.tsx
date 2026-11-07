import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SolflareWalletName } from "@solana/wallet-adapter-solflare";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { MissionEngine } from "../engine/useMissionEngine";
import { explorerTxUrl, PROGRAM_ID } from "../lib/constants";
import { prepareMission } from "../lib/program";
import { LessonQuiz } from "./LessonQuiz";

const ERRORS: Record<string, string> = {
  rejected:
    "Request declined. Nothing was approved in that request. Review the details whenever you feel ready to try again.",
  insufficient:
    "Your Devnet SOL balance is too low for the fee. Revisit Receive test SOL, then return here.",
  network:
    "The configured RPC is not Solana Devnet. No transaction was requested. Check the app’s RPC configuration and your wallet network.",
  program:
    "The teaching program is not available on the configured Devnet endpoint. Try later or ask the project maintainer to check deployment.",
  execution:
    "The transaction was submitted but execution failed. Inspect the receipt below; this lesson has not been marked complete.",
  expired:
    "The transaction expired. If a signature is shown, inspect its outcome before submitting a new request.",
  rpc: "The network service is unavailable or rate-limited. Wait and retry. If there is a receipt below, inspect it before sending again.",
  "balance-rpc":
    "Could not read your Devnet balance. We will retry automatically. Check your connection; this does not mean your balance is zero.",
  invalid:
    "That code does not match. Check the full CTF{...} string, including capitalization and braces, in the program logs.",
  unknown:
    "Could not complete this check. If a receipt is shown, inspect it before trying another transaction.",
};
const VERIFICATION = {
  self: "Self-confirmed",
  wallet: "Wallet check",
  rpc: "Devnet RPC check",
  answer: "Local answer check",
  read: "Learning summary",
  understanding: "Learning check",
};
export function ActionZone({ engine }: { engine: MissionEngine }) {
  const { step, status, passed, failReason, signature } = engine;
  const wallet = useWallet();
  const [answer, setAnswer] = useState("");
  if (step.action === "quiz")
    return (
      <LessonQuiz
        step={step}
        passed={passed}
        checkAnswer={engine.checkAnswer}
      />
    );
  return (
    <section className="practice-panel" aria-label="Hands-on practice">
      <div className="practice-heading">
        <span className="section-label">
          {step.action === "summary"
            ? "Your learning record"
            : "Put it into practice"}
        </span>
        <span className="check-label">{VERIFICATION[step.verification]}</span>
      </div>
      {step.action === "install" && (
        <>
          {[
            { name: "Phantom", url: "https://phantom.app/download" },
            { name: "Solflare", url: "https://www.solflare.com/download/" },
          ].map(({ name, url }) => (
            <div className="install-resource" key={name}>
              <span className="resource-icon" aria-hidden>
                ↗
              </span>
              <div>
                <strong>Get {name}</strong>
                <p>Install from the official website for your device.</p>
                <a href={url} target="_blank" rel="noreferrer">
                  Download {name} ↗
                </a>
              </div>
            </div>
          ))}
        </>
      )}
      {step.id === "3.1" && (
        <p className="panel-description">
          Using Solflare? Follow its{" "}
          <a
            href="https://help.solflare.com/en/articles/6328814-differences-between-mainnet-devnet-and-testnet-and-how-to-switch-between-on-solflare"
            target="_blank"
            rel="noreferrer"
          >
            official network-switching guide
          </a>
          .
        </p>
      )}
      {step.verification === "self" && (
        <div className="self-confirm">
          <p>
            {step.action === "explorer"
              ? "This is your acknowledgment of inspecting the receipt."
              : "Complete this step in your wallet, then confirm here. This app cannot inspect your setup or backup."}
          </p>
          <button
            className="button button-primary"
            disabled={passed || (step.action === "explorer" && !signature)}
            onClick={engine.confirmManual}
          >
            {passed ? "✓ Confirmed" : step.confirmLabel}
          </button>
        </div>
      )}
      {step.action === "connect" && (
        <>
          <p className="panel-description">
            Choose your practice wallet. Only its public address is shared with
            this app.
          </p>
          {!wallet.connected && (
            <div className="wallet-choice">
              <p>Using Solflare? Select it here, then press Connect.</p>
              <button
                className="button button-secondary"
                disabled={
                  wallet.connecting ||
                  wallet.disconnecting ||
                  wallet.wallet?.adapter.name === SolflareWalletName
                }
                onClick={() => wallet.select(SolflareWalletName)}
              >
                {wallet.wallet?.adapter.name === SolflareWalletName
                  ? "Solflare selected"
                  : "Choose Solflare"}
              </button>
            </div>
          )}
          <WalletMultiButton />
          {wallet.publicKey && (
            <Address
              value={wallet.publicKey.toBase58()}
              label="Connected public address"
            />
          )}
        </>
      )}
      {step.action === "faucet" && (
        <>
          {wallet.publicKey ? (
            <Address
              value={wallet.publicKey.toBase58()}
              label="Your public Solana address"
            />
          ) : (
            <>
              <p>Reconnect your practice wallet to check its balance.</p>
              <WalletMultiButton />
            </>
          )}
          <div className="balance-row">
            <div>
              <span className="field-label">DEVNET BALANCE</span>
              <strong>
                {engine.balanceLamports === null
                  ? "Checking…"
                  : `${(engine.balanceLamports / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 9 })} SOL`}
              </strong>
            </div>
            <a
              className="button button-primary"
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open faucet ↗
            </a>
          </div>
          <p className="panel-caption">
            Free test funds · Balance checked every 4 seconds
          </p>
        </>
      )}
      {step.action === "transaction" && (
        <>
          <TransactionPreview
            enabled={!passed}
            onSubmit={engine.runCast}
            busy={status === "checking"}
          />
          {!wallet.connected && <WalletMultiButton />}
        </>
      )}
      {(step.action === "explorer" || step.action === "transaction") &&
        signature && <Receipt signature={signature} />}
      {step.action === "flag" && (
        <form
          className="flag-form"
          onSubmit={(event) => {
            event.preventDefault();
            void engine.runFlag(answer);
          }}
        >
          <label htmlFor="exercise-code">Public exercise code</label>
          <p className="panel-caption">
            Only the CTF code from the logs belongs here.
          </p>
          <div className="input-row">
            <input
              id="exercise-code"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="CTF{...}"
              autoComplete="off"
              spellCheck={false}
              disabled={passed || status === "checking"}
            />
            <button
              className="button button-primary"
              disabled={!answer.trim() || passed || status === "checking"}
            >
              {status === "checking"
                ? "Checking…"
                : passed
                  ? "✓ Checked"
                  : "Check answer"}
            </button>
          </div>
          {signature && (
            <a
              className="inline-link"
              href={explorerTxUrl(signature)}
              target="_blank"
              rel="noreferrer"
            >
              Reopen your transaction ↗
            </a>
          )}
        </form>
      )}
      {step.action === "summary" && (
        <>
          <h2>You’ve completed the walkthrough.</h2>
          <p className="panel-description">
            Your progress is saved in this browser for your connected account.
            You can review any lesson from the outline.
          </p>
          <ul className="summary-list">
            <li>
              Web3 foundations and safe decisions{" "}
              <span>Local learning checks</span>
            </li>
            <li>
              Wallet setup and recovery backup <span>Self-confirmed</span>
            </li>
            <li>
              Wallet connection <span>Wallet checked</span>
            </li>
            <li>
              Devnet selection <span>Self-confirmed</span>
            </li>
            <li>
              Positive balance and program call <span>RPC checked</span>
            </li>
            <li>
              Explorer inspection and exercise code{" "}
              <span>Self + local check</span>
            </li>
          </ul>
          {signature && <Receipt signature={signature} />}
        </>
      )}
      {failReason && (
        <p
          className={`feedback ${failReason === "rejected" ? "notice" : "warning"}`}
          role="alert"
        >
          {ERRORS[failReason] ?? ERRORS.unknown}
        </p>
      )}
      {passed && step.action !== "summary" && (
        <p className="feedback success" role="status">
          ✓{" "}
          {step.verification === "self"
            ? "You confirmed this step."
            : step.verification === "answer"
              ? "Exercise code matched."
              : "Check complete."}{" "}
          You can continue or review the explanation.
        </p>
      )}
    </section>
  );
}
function Address({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState("Copy");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied");
    } catch {
      setMessage("Select and copy manually");
    }
  }
  return (
    <div className="address-box">
      <span className="field-label">{label}</span>
      <div>
        <code>{value}</code>
        <button
          className="copy-button"
          onClick={() => {
            void copy();
          }}
          type="button"
        >
          {message}
        </button>
      </div>
    </div>
  );
}
function Receipt({ signature }: { signature: string }) {
  return (
    <div className="receipt">
      <span className="field-label">TRANSACTION RECEIPT · DEVNET</span>
      <Address value={signature} label="Transaction signature" />
      <a
        className="inline-link"
        href={explorerTxUrl(signature)}
        target="_blank"
        rel="noreferrer"
      >
        Inspect in Solana Explorer ↗
      </a>
    </div>
  );
}
function TransactionPreview({
  enabled,
  busy,
  onSubmit,
}: {
  enabled: boolean;
  busy: boolean;
  onSubmit: () => Promise<void>;
}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [preview, setPreview] = useState<{
    fee: number | null;
    error: string | null;
  }>({ fee: null, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!publicKey || !enabled) return;
    let cancelled = false;
    void prepareMission(connection, publicKey)
      .then((result) => {
        if (!cancelled) setPreview({ fee: result.feeLamports, error: null });
      })
      .catch(() => {
        if (!cancelled)
          setPreview({
            fee: null,
            error:
              "Could not prepare a Devnet preview. The RPC or teaching program may be unavailable. No signing request was made.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey, enabled, retry]);
  return (
    <div className="transaction-preview">
      <h3>Before your wallet opens</h3>
      <dl>
        <div>
          <dt>Network</dt>
          <dd>Solana Devnet</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>Call the teaching program to write a public log</dd>
        </div>
        <div>
          <dt>Asset transfer</dt>
          <dd>No SOL transfer instruction</dd>
        </div>
        <div>
          <dt>Estimated network fee</dt>
          <dd>
            {preview.fee === null
              ? enabled
                ? "Unavailable until preview loads"
                : "See your receipt"
              : `${preview.fee} lamports (${preview.fee / 1_000_000_000} SOL)`}
          </dd>
        </div>
        <div>
          <dt>Program address</dt>
          <dd>
            <code>{PROGRAM_ID.toBase58()}</code>
          </dd>
        </div>
      </dl>
      <p className="panel-caption">
        The fee is refreshed before sending and may differ. Read the wallet’s
        final details. The fee payer is your connected wallet.
      </p>
      {preview.error && (
        <div className="feedback warning" role="alert">
          {preview.error}{" "}
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setPreview({ fee: null, error: null });
              setRetry((n) => n + 1);
            }}
          >
            Retry preview
          </button>
        </div>
      )}
      <button
        className="button button-primary"
        disabled={
          !publicKey ||
          busy ||
          !enabled ||
          preview.fee === null ||
          !!preview.error
        }
        onClick={() => {
          void onSubmit();
        }}
      >
        {busy
          ? "Waiting for wallet / network…"
          : !enabled
            ? "✓ Transaction completed"
            : "Review in wallet"}{" "}
        <span aria-hidden>↗</span>
      </button>
    </div>
  );
}
