import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  useConnection,
  useWallet,
  type WalletContextState,
} from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { Connection } from "@solana/web3.js";
import { LIVE_SCAMS } from "../content/liveScams";
import { explorerTxUrl } from "../lib/constants";
import { assertDevnet } from "../lib/network";
import {
  TRAINING_DESTINATION,
  prepareTrainingTransfer,
  submitTrainingTransfer,
  refreshTrainingAttempt,
  readAttempt,
  unresolvedAttempt,
  trainingMessage,
  signTrainingMessage,
  withTrainingLock,
  type Attempt,
  type PreparedTransfer,
} from "../lib/liveScam";
import { Icon } from "./Icon";

function MessageExercise({
  scenarioId,
  onBusy,
}: {
  scenarioId: string;
  onBusy: (busy: boolean) => void;
}) {
  const wallet = useWallet();
  const { connection } = useConnection();
  return (
    <Exercise
      key={wallet.publicKey?.toBase58() ?? "disconnected"}
      scenarioId={scenarioId}
      wallet={wallet}
      connection={connection}
      onBusy={onBusy}
    />
  );
}
function saved(owner: string, scenario: string) {
  return owner
    ? (unresolvedAttempt(owner) ?? readAttempt(owner, scenario))
    : null;
}
const pending = (a: Attempt | null) =>
  !!a && (a.status === "signed" || a.status === "pending");
function Exercise({
  scenarioId,
  wallet,
  connection,
  onBusy,
}: {
  scenarioId: string;
  wallet: WalletContextState;
  connection: Connection;
  onBusy: (busy: boolean) => void;
}) {
  const scenario = LIVE_SCAMS[scenarioId];
  const owner = wallet.publicKey?.toBase58() ?? "";
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [prepared, setPrepared] = useState<PreparedTransfer | null>(null);
  const [message, setMessage] = useState("");
  const [messageVerified, setMessageVerified] = useState(false);
  const [initial] = useState(() => {
    try {
      return { attempt: saved(owner, scenarioId), error: "" };
    } catch (e) {
      return { attempt: null, error: errorText(e) };
    }
  });
  const [attempt, setAttempt] = useState<Attempt | null>(initial.attempt);
  const [storageError, setStorageError] = useState(initial.error);
  const mounted = useRef(false);
  const operation = useRef(false);
  const current = useRef({ wallet, consent });
  useLayoutEffect(() => {
    current.current = { wallet, consent };
  }, [wallet, consent]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      onBusy(false);
    };
  }, [owner, scenarioId, onBusy]);
  const active = () =>
    mounted.current &&
    current.current.consent &&
    current.current.wallet.connected &&
    current.current.wallet.publicKey?.toBase58() === owner;
  async function run(task: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    onBusy(true);
    setNotice("");
    try {
      await task();
    } catch (error) {
      if (mounted.current) {
        let stored: Attempt | null = null;
        try {
          stored = saved(owner, scenarioId);
          setAttempt(stored);
        } catch (e) {
          setStorageError(errorText(e));
        }
        if (pending(stored)) {
          setPrepared(null);
          setNotice(
            "A signed receipt is saved. Submission may be uncertain. Check its status before trying another transfer.",
          );
        } else
          setNotice(
            isDeclined(error)
              ? "Request declined in the wallet. This attempt did not submit a transaction or complete a learning check."
              : errorText(error),
          );
      }
    } finally {
      operation.current = false;
      if (mounted.current) {
        setBusy(false);
        onBusy(false);
      }
    }
  }
  async function prepare() {
    if (!active() || !wallet.publicKey) return;
    await withTrainingLock(owner, async () => {
      if (scenario.kind === "transfer") {
        const result = await prepareTrainingTransfer(
          connection,
          wallet.publicKey!,
          scenarioId,
        );
        if (active()) {
          setPrepared(result);
          setAttempt(saved(owner, scenarioId));
          setNotice(
            "Devnet simulation passed. Review the exact payment below before opening your wallet.",
          );
        }
      } else {
        await assertDevnet(connection);
        if (active()) {
          setMessage(
            trainingMessage(
              window.location.origin,
              scenarioId,
              owner,
              crypto.randomUUID(),
            ),
          );
          setMessageVerified(false);
          setNotice(
            "Read the exact message below. No wallet request has been made.",
          );
        }
      }
    });
  }
  async function requestWallet() {
    if (!active() || !wallet.publicKey) return;
    await withTrainingLock(owner, async () => {
      if (scenario.kind === "message") {
        if (!wallet.signMessage || !message)
          throw new Error(
            "This wallet does not support message signing. Use Preview mode or a compatible wallet.",
          );
        await signTrainingMessage(
          connection,
          wallet.publicKey!,
          message,
          wallet.signMessage,
          active,
        );
        if (active()) {
          setMessageVerified(true);
          setMessage("");
          setNotice(
            "Training message signature verified. No SOL was transferred and no login session was created.",
          );
        }
      } else {
        if (!wallet.signTransaction || !prepared)
          throw new Error(
            "This wallet does not support signing this transaction. Use Preview mode or a compatible wallet.",
          );
        const result = await submitTrainingTransfer(
          connection,
          prepared,
          (tx) => wallet.signTransaction!(tx),
          active,
        );
        if (mounted.current) {
          setAttempt(result);
          setPrepared(null);
        }
        const checked = await refreshTrainingAttempt(connection, result);
        if (mounted.current) setAttempt(checked);
      }
    });
  }
  const unsupported =
    scenario.kind === "transfer"
      ? !wallet.signTransaction
      : !wallet.signMessage;
  return (
    <section className="live-exercise" aria-label="Real Devnet wallet exercise">
      <div className="live-banner">
        <Icon name="shield" size={18} />
        <strong>REAL WALLET PRACTICE · DEVNET ONLY</strong>
      </div>
      <div className="live-exercise-body">
        <h2>{scenario.title}</h2>
        <p>{scenario.invitation}</p>
        <aside className="live-boundaries">
          <strong>
            {scenario.kind === "transfer"
              ? "This exercise can move test SOL."
              : "This exercise asks for a real message signature."}
          </strong>
          <p>
            Use a fresh practice account. Never enter recovery words or private
            keys here. This is an optional exercise; your course checks remain
            separate.
          </p>
          {scenario.kind === "transfer" ? (
            <p>
              Each approved transfer sends exactly{" "}
              <strong>0.001 Devnet SOL</strong> to the course training
              destination, plus a network fee capped at{" "}
              <strong>0.00005 SOL</strong>. There is no payout or automatic
              refund. Each repeat is a separate payment.
            </p>
          ) : (
            <p>
              The message is marked training-only and is never sent to a login
              endpoint. It does not itself transfer SOL or grant token
              permissions.
            </p>
          )}
        </aside>
        {!wallet.connected || !wallet.publicKey ? (
          <>
            <p>
              Connect your practice account to continue. Preview mode works
              without a wallet.
            </p>
            <WalletMultiButton />
          </>
        ) : (
          <>
            <dl className="live-review">
              <div>
                <dt>Connected practice account</dt>
                <dd>
                  <code>{owner}</code>
                </dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>Solana Devnet · verified before requests</dd>
              </div>
              {scenario.kind === "transfer" && (
                <div>
                  <dt>Course training destination · no automatic refund</dt>
                  <dd>
                    <code>{TRAINING_DESTINATION.toBase58()}</code>
                  </dd>
                </div>
              )}
            </dl>
            <label className="live-consent">
              <input
                type="checkbox"
                checked={consent}
                disabled={busy}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setPrepared(null);
                  setMessage("");
                }}
              />
              <span>
                I am using a practice account and understand{" "}
                {scenario.kind === "transfer"
                  ? "that approving this exercise sends 0.001 Devnet SOL plus the fee, without an automatic refund."
                  : "that the wallet will sign the exact training message I review."}
              </span>
            </label>
            {unsupported && (
              <p role="alert">
                This wallet does not support the required{" "}
                {scenario.kind === "transfer" ? "transaction" : "message"}{" "}
                signing method. Use Preview mode or a compatible wallet.
              </p>
            )}
            {storageError && <p role="alert">{storageError}</p>}
            {pending(attempt) && (
              <p className="live-pending">
                A saved transfer in {attempt!.scenario} needs a receipt check.
                New transfers are blocked for this account until its outcome is
                known.
              </p>
            )}
            <button
              className="button button-secondary"
              disabled={
                !consent ||
                busy ||
                unsupported ||
                !!storageError ||
                pending(attempt)
              }
              onClick={() => void run(prepare)}
            >
              {busy
                ? "Working…"
                : prepared || message
                  ? "Prepare a fresh preview"
                  : "Prepare and review request"}
            </button>
            {prepared && (
              <div className="live-prepared">
                <h3>Payment review · simulation passed</h3>
                <dl className="live-review">
                  <div>
                    <dt>Sender and fee payer</dt>
                    <dd>
                      <code>{prepared.owner}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Actual recipient</dt>
                    <dd>
                      <code>{TRAINING_DESTINATION.toBase58()}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Amount leaving the account</dt>
                    <dd>0.001 Devnet SOL</dd>
                  </div>
                  <div>
                    <dt>Estimated fee</dt>
                    <dd>{prepared.feeLamports / 1e9} Devnet SOL</dd>
                  </div>
                  <div>
                    <dt>Instruction</dt>
                    <dd>
                      One native SOL transfer. No reward, token approval, or
                      verification service.
                    </dd>
                  </div>
                </dl>
              </div>
            )}
            {message && (
              <pre
                className="training-message"
                aria-label="Exact training message"
              >
                {message}
              </pre>
            )}
            {(prepared || message) && (
              <button
                className="button button-primary"
                disabled={!consent || busy || unsupported || pending(attempt)}
                onClick={() => void run(requestWallet)}
              >
                {scenario.action}
              </button>
            )}
            {(prepared || message) && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setPrepared(null);
                  setMessage("");
                  setNotice(
                    "Stopped before the wallet request. Nothing was signed or sent.",
                  );
                }}
              >
                Stop before signing
              </button>
            )}
          </>
        )}
        {notice && (
          <p className="live-notice" role="status">
            {notice}
          </p>
        )}
        {messageVerified && (
          <div className="live-outcome">
            <h3>What you authorized</h3>
            <p>{scenario.explanation}</p>
          </div>
        )}
        {attempt && (
          <div className="live-receipt">
            <h3>Training receipt · {attempt.scenario}</h3>
            <p className="live-outcome-label">{outcome(attempt)}</p>
            <a
              href={explorerTxUrl(attempt.signature)}
              target="_blank"
              rel="noreferrer"
            >
              Inspect this signature on Devnet Explorer
            </a>
            <button
              className="button button-secondary"
              disabled={busy || !wallet.connected}
              onClick={() =>
                void run(async () => {
                  await withTrainingLock(owner, async () => {
                    const checked = await refreshTrainingAttempt(
                      connection,
                      attempt,
                    );
                    if (mounted.current) {
                      setAttempt(checked);
                      setNotice(
                        pending(checked)
                          ? "The receipt is not yet conclusive. No new transaction was sent. Check again later."
                          : "Receipt checked against Solana Devnet.",
                      );
                    }
                  });
                })
              }
            >
              Check saved receipt
            </button>
            {attempt.status === "confirmed" && (
              <p>{LIVE_SCAMS[attempt.scenario].explanation}</p>
            )}
          </div>
        )}
        <p className="live-footnote">
          Transfer receipts stay in this browser, separate from course progress.
          Signing a message or approving a transfer does not mark the lesson
          complete.
        </p>
      </div>
    </section>
  );
}
function outcome(attempt: Attempt) {
  if (attempt.status === "confirmed")
    return "Confirmed: the practice account sent 0.001 Devnet SOL to the training destination, plus its network fee.";
  if (attempt.status === "failed")
    return "Execution failed: the transfer did not take effect. A network fee may still have been charged.";
  if (attempt.status === "expired")
    return "No transaction was found after its blockhash expired. This attempt is closed; a new attempt requires your approval again.";
  return "Signed receipt saved; successful execution has not been verified. Do not assume funds moved or send again.";
}
function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Could not finish the wallet exercise. Check any saved receipt before trying again.";
}
function isDeclined(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (("code" in error && error.code === 4001) ||
      ("message" in error &&
        typeof error.message === "string" &&
        /reject|declin|cancel/i.test(error.message)))
  );
}

/** Only the disclosed training message remains launchable. Transfer receipts are recovered separately. */
export function LiveScamExercise(props: {
  scenarioId: string;
  onBusy: (busy: boolean) => void;
}) {
  return LIVE_SCAMS[props.scenarioId]?.kind === "message" ? (
    <MessageExercise {...props} />
  ) : null;
}
