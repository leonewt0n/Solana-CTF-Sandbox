import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  prepareRequest,
  submitRequest,
  reconcileRequest,
  readTransactionAttempt,
  pendingTransaction,
  withTransactionLock,
  type Action,
  type PreparedRequest,
  type TransactionAttempt,
} from "../lib/transactionLifecycle";
import { LIVE_SCAMS } from "../content/liveScams";
import {
  readAttempt,
  refreshTrainingAttempt,
  type Attempt,
} from "../lib/liveScam";
import { explorerTxUrl, PROGRAM_ID } from "../lib/constants";

export function WalletTransaction({
  action,
  onReceipt,
}: {
  action: Action;
  onReceipt: (action: Action, signature: string) => void;
}) {
  const wallet = useWallet();
  return (
    <Exercise
      key={`${wallet.publicKey?.toBase58()}:${action}`}
      action={action}
      onReceipt={onReceipt}
    />
  );
}
function Exercise({
  action,
  onReceipt,
}: {
  action: Action;
  onReceipt: (action: Action, signature: string) => void;
}) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const owner = wallet.publicKey?.toBase58() ?? "";
  const [recipient, setRecipient] = useState("");
  const [reviewedAddress, setReviewedAddress] = useState(false);
  const [prepared, setPrepared] = useState<PreparedRequest | null>(null);
  const [initial] = useState(() => {
    let legacy: Attempt[] = [];
    try {
      if (!owner) return { attempt: null, legacy, error: "" };
      legacy = Object.entries(LIVE_SCAMS)
        .filter(([, s]) => s.kind === "transfer")
        .map(([id]) => readAttempt(owner, id))
        .filter((a): a is Attempt => !!a);
      return {
        attempt:
          pendingTransaction(owner) ?? readTransactionAttempt(owner, action),
        legacy,
        error: "",
      };
    } catch (e) {
      return { attempt: null, legacy, error: String(e) };
    }
  });
  const [attempt, setAttempt] = useState<TransactionAttempt | null>(
    initial.attempt,
  );
  const [legacy, setLegacy] = useState<Attempt[]>(initial.legacy);
  const [notice, setNotice] = useState(initial.error);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const running = useRef(false);
  const current = useRef({
    owner,
    recipient,
    connected: wallet.connected,
    endpoint: connection.rpcEndpoint,
  });
  useLayoutEffect(() => {
    current.current = {
      owner,
      recipient,
      connected: wallet.connected,
      endpoint: connection.rpcEndpoint,
    };
  });
  const active = () =>
    mounted.current &&
    current.current.owner === owner &&
    current.current.connected &&
    current.current.recipient === recipient &&
    current.current.endpoint === connection.rpcEndpoint;
  async function run(task: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setNotice("");
    try {
      await withTransactionLock(owner, task);
    } catch (e) {
      if (mounted.current) {
        setNotice(e instanceof Error ? e.message : String(e));
        setPrepared(null);
        try {
          setAttempt(
            pendingTransaction(owner) ?? readTransactionAttempt(owner, action),
          );
        } catch {
          /* Preserve invalid record for investigation. */
        }
      }
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function reconcile(a: TransactionAttempt) {
    const checked = await reconcileRequest(connection, a);
    if (!active()) return;
    setAttempt(checked);
    if (checked.status === "confirmed")
      onReceipt(checked.action, checked.signature);
    setNotice(
      checked.status === "pending"
        ? "Outcome unresolved. Do not send again; check later."
        : `Receipt verified: ${checked.status}.`,
    );
  }
  useEffect(() => {
    mounted.current = true;
    if (initial.attempt) void run(() => reconcile(initial.attempt!));
    return () => {
      mounted.current = false;
    };
    // This keyed account/action session reconciles once on mount. Never sign automatically.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section
      className="transaction-preview"
      aria-label="Devnet transaction practice"
    >
      <h3>
        {action === "transfer"
          ? "Wallet A to Wallet B · exactly 0.001 Devnet SOL"
          : "Teaching program · Devnet"}
      </h3>
      <p>
        Use practice accounts. Review network, full addresses, instruction,
        simulation and fee before signing.
      </p>
      {!wallet.connected ? (
        <WalletMultiButton />
      ) : (
        <>
          <p>
            Sender and fee payer: <code>{owner}</code>
          </p>
          {action === "transfer" && (
            <>
              <label className="scenario-picker">
                Wallet B public address
                <input
                  aria-label="Wallet B public address"
                  value={recipient}
                  disabled={busy}
                  autoComplete="off"
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    setPrepared(null);
                    setReviewedAddress(false);
                  }}
                />
              </label>
              <p>
                Create Wallet B yourself. This form accepts only its public
                address. A valid address cannot prove who controls it.
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={reviewedAddress}
                  disabled={busy}
                  onChange={(e) => {
                    setReviewedAddress(e.target.checked);
                    setPrepared(null);
                  }}
                />{" "}
                I compared the entire address above with my own Wallet B.
              </label>
            </>
          )}
          <button
            className="button button-secondary"
            disabled={
              busy ||
              !wallet.signTransaction ||
              (action === "transfer" && !reviewedAddress) ||
              (!!attempt && ["signed", "pending"].includes(attempt.status))
            }
            onClick={() =>
              void run(async () => {
                const result = await prepareRequest(
                  connection,
                  wallet.publicKey!,
                  action,
                  action === "transfer" ? recipient : null,
                );
                if (active()) setPrepared(result);
              })
            }
          >
            Prepare and simulate request
          </button>
          {!wallet.signTransaction && (
            <p>This wallet lacks transaction signing support.</p>
          )}
        </>
      )}
      {prepared && (
        <div className="live-prepared">
          <h3>Review this exact request · simulation passed</h3>
          <dl className="live-review">
            {Object.entries({
              Network: prepared.network,
              Owner: prepared.owner,
              Recipient: prepared.recipient ?? PROGRAM_ID.toBase58(),
              Effects: prepared.expectedEffects,
              "Fee (lamports)": prepared.feeLamports,
              Blockhash: prepared.blockhash,
              "Last valid block height": prepared.lastValidBlockHeight,
            }).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <code>{value}</code>
                </dd>
              </div>
            ))}
          </dl>
          <details>
            <summary>Exact transaction message (base58)</summary>
            <code className="transaction-message">{prepared.message}</code>
          </details>
          <p>
            Changing owner, network, recipient or instructions invalidates this
            review. Expiry requires a fresh preview.
          </p>
          <button
            className="button button-primary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const sent = await submitRequest(
                  connection,
                  prepared,
                  (tx) => wallet.signTransaction!(tx),
                  active,
                );
                if (mounted.current) {
                  setAttempt(sent);
                  setPrepared(null);
                }
                await reconcile(sent);
              })
            }
          >
            Review in wallet
          </button>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setPrepared(null)}
          >
            Cancel review
          </button>
        </div>
      )}
      {attempt && (
        <div className="receipt">
          <h3>
            Saved {attempt.action} receipt · {attempt.status}
          </h3>
          <a
            href={explorerTxUrl(attempt.signature)}
            target="_blank"
            rel="noreferrer"
          >
            Inspect transaction on Devnet
          </a>
          <button
            className="button button-secondary"
            disabled={busy}
            onClick={() => void run(() => reconcile(attempt))}
          >
            Reconcile saved receipt
          </button>
          {attempt.receipt && (
            <p>
              Recorded sender change: {attempt.receipt.senderChange} lamports.
              Recorded recipient change:{" "}
              {attempt.receipt.recipientChange ?? "No transfer"}. Fee:{" "}
              {attempt.receipt.fee} lamports. Current wallet balances may
              include other activity.
            </p>
          )}
        </div>
      )}
      {legacy.map((a) => (
        <div className="receipt" key={a.signature}>
          <p>
            Legacy training receipt · {a.scenario} · {a.status}
          </p>
          <a href={explorerTxUrl(a.signature)} target="_blank" rel="noreferrer">
            Inspect legacy transaction
          </a>
          <button
            className="button button-secondary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const checked = await refreshTrainingAttempt(connection, a);
                if (mounted.current)
                  setLegacy((list) =>
                    list.map((item) =>
                      item.signature === checked.signature ? checked : item,
                    ),
                  );
              })
            }
          >
            Reconcile legacy receipt
          </button>
        </div>
      ))}
      {busy && <p role="status">Waiting for wallet or network…</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
