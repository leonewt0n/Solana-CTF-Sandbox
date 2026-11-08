/** Shared boundary for the existing wallet-adapter integration. No automatic signing or retries. */
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  type Connection,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import bs58 from "bs58";
import { PROGRAM_ID, TRIGGER_MISSION_DISCRIMINATOR } from "./constants";
import { assertDevnet } from "./network";
import {
  unresolvedAttempt as legacyPending,
  withTrainingLock,
} from "./liveScam";
export { withTrainingLock as withTransactionLock };
export const TRANSFER_LAMPORTS = 1_000_000;
export const MAX_FEE_LAMPORTS = 50_000;
export const ATTEMPT_PREFIX = "solana-learn:transactions:v1:";
export type Action = "transfer" | "program";
export type PreparedRequest = {
  owner: string;
  action: Action;
  network: "devnet";
  endpoint: string;
  recipient: string | null;
  transaction: Transaction;
  message: string;
  blockhash: string;
  lastValidBlockHeight: number;
  minContextSlot: number;
  feeLamports: number;
  expectedEffects: string;
};
export type TransactionAttempt = Omit<PreparedRequest, "transaction"> & {
  signature: string;
  createdAt: number;
  status: "signed" | "pending" | "confirmed" | "failed" | "expired";
  receipt?: {
    fee: number;
    senderChange: number;
    recipientChange: number | null;
  };
};
// Only requests prepared and simulated in this process can be signed; restored attempts can only be reconciled.
const reviewed = new WeakMap<PreparedRequest, string>();
const key = (owner: string, action: Action) =>
  ATTEMPT_PREFIX + owner + ":" + action;
const terminal = (a: TransactionAttempt) =>
  ["confirmed", "failed", "expired"].includes(a.status);
export function destination(owner: PublicKey, value: string) {
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(value);
  } catch {
    throw new Error("Enter only Wallet B's valid public Solana address.");
  }
  if (!PublicKey.isOnCurve(recipient.toBytes()) || recipient.equals(owner))
    throw new Error("Use a different learner-created Wallet B public address.");
  return recipient;
}
function instruction(
  owner: PublicKey,
  action: Action,
  recipient: string | null,
) {
  return action === "transfer"
    ? SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: destination(owner, recipient ?? ""),
        lamports: TRANSFER_LAMPORTS,
      })
    : new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [{ pubkey: owner, isSigner: true, isWritable: false }],
        data: Buffer.from(TRIGGER_MISSION_DISCRIMINATOR),
      });
}
function expectedMessage(
  request: Pick<
    PreparedRequest,
    "owner" | "action" | "recipient" | "blockhash"
  >,
) {
  return bs58.encode(
    new Transaction({
      feePayer: new PublicKey(request.owner),
      recentBlockhash: request.blockhash,
    })
      .add(
        instruction(
          new PublicKey(request.owner),
          request.action,
          request.recipient,
        ),
      )
      .serializeMessage(),
  );
}
export function saveTransactionAttempt(attempt: TransactionAttempt) {
  const value = JSON.stringify(attempt);
  localStorage.setItem(key(attempt.owner, attempt.action), value);
  if (localStorage.getItem(key(attempt.owner, attempt.action)) !== value)
    throw new Error("Durable receipt storage failed. Submission stopped.");
}
export function readTransactionAttempt(
  owner: string,
  action: Action,
): TransactionAttempt | null {
  const raw = localStorage.getItem(key(owner, action));
  if (!raw) return null;
  try {
    const a: TransactionAttempt = JSON.parse(raw);
    if (
      a.owner !== owner ||
      a.action !== action ||
      a.network !== "devnet" ||
      !["signed", "pending", "confirmed", "failed", "expired"].includes(
        a.status,
      ) ||
      !/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(a.signature) ||
      !Number.isSafeInteger(a.lastValidBlockHeight) ||
      a.lastValidBlockHeight < 0 ||
      !Number.isSafeInteger(a.feeLamports) ||
      a.feeLamports < 0 ||
      a.feeLamports > MAX_FEE_LAMPORTS ||
      expectedMessage(a) !== a.message
    )
      throw new Error();
    return a;
  } catch {
    throw new Error(
      "Saved transaction metadata is invalid. New transactions are blocked; preserve the original record for investigation.",
    );
  }
}
export function pendingTransaction(owner: string) {
  const legacy = legacyPending(owner);
  if (legacy)
    throw new Error(
      "A legacy training receipt is unresolved. Reconcile it before another transaction.",
    );
  for (const action of ["transfer", "program"] as const) {
    const a = readTransactionAttempt(owner, action);
    if (a && !terminal(a)) return a;
  }
  return null;
}
export async function prepareRequest(
  connection: Connection,
  owner: PublicKey,
  action: Action,
  recipient: string | null = null,
): Promise<PreparedRequest> {
  await assertDevnet(connection);
  if (pendingTransaction(owner.toBase58()))
    throw new Error(
      "Reconcile the pending transaction before preparing another.",
    );
  if (
    action === "program" &&
    !(await connection.getAccountInfo(PROGRAM_ID, "confirmed"))?.executable
  )
    throw new Error("Teaching program unavailable on Devnet");
  const { context, value } =
    await connection.getLatestBlockhashAndContext("confirmed");
  const transaction = new Transaction({
    feePayer: owner,
    recentBlockhash: value.blockhash,
  }).add(instruction(owner, action, recipient));
  const fee = (
    await connection.getFeeForMessage(transaction.compileMessage(), "confirmed")
  ).value;
  if (
    fee === null ||
    !Number.isSafeInteger(fee) ||
    fee < 0 ||
    fee > MAX_FEE_LAMPORTS
  )
    throw new Error(
      "Fee estimate unavailable or above the 50,000-lamport cap.",
    );
  if (
    (await connection.getBalance(owner, "confirmed")) <
    fee + (action === "transfer" ? TRANSFER_LAMPORTS : 0)
  )
    throw new Error("Insufficient Devnet SOL for amount plus fee.");
  const simulation = await connection.simulateTransaction(
    new VersionedTransaction(transaction.compileMessage()),
    { sigVerify: false, commitment: "confirmed", minContextSlot: context.slot },
  );
  if (simulation.value.err)
    throw new Error("Simulation failed. No signature requested.");
  const request: PreparedRequest = {
    owner: owner.toBase58(),
    action,
    network: "devnet",
    endpoint: connection.rpcEndpoint,
    recipient,
    transaction,
    message: bs58.encode(transaction.serializeMessage()),
    ...value,
    minContextSlot: context.slot,
    feeLamports: fee,
    expectedEffects:
      action === "transfer"
        ? "Wallet A sends exactly 0.001 Devnet SOL to Wallet B and pays the network fee."
        : "Call the teaching program for a public practice code. No SOL transfer instruction; the signer pays the network fee.",
  };
  reviewed.set(request, JSON.stringify({ ...request, transaction: undefined }));
  return request;
}
function activeCheck(active: () => boolean) {
  if (!active())
    throw new Error(
      "Wallet, recipient, lesson, or network changed. Review a new request.",
    );
}
export async function submitRequest(
  connection: Connection,
  request: PreparedRequest,
  sign: (tx: Transaction) => Promise<Transaction>,
  active: () => boolean,
) {
  activeCheck(active);
  await assertDevnet(connection);
  activeCheck(active);
  if (
    request.endpoint !== connection.rpcEndpoint ||
    reviewed.get(request) !==
      JSON.stringify({ ...request, transaction: undefined }) ||
    request.message !== expectedMessage(request) ||
    bs58.encode(request.transaction.serializeMessage()) !== request.message
  )
    throw new Error("Prepared request changed. Review again.");
  if (pendingTransaction(request.owner))
    throw new Error("A transaction is unresolved.");
  if (
    (await connection.getBlockHeight("confirmed")) >
    request.lastValidBlockHeight
  )
    throw new Error("Preview expired. Review a fresh request.");
  if (
    (await connection.getBalance(new PublicKey(request.owner), "confirmed")) <
    request.feeLamports +
      (request.action === "transfer" ? TRANSFER_LAMPORTS : 0)
  )
    throw new Error("Insufficient Devnet SOL.");
  activeCheck(active);
  // Recheck after RPC awaits, then retain an immutable copy across the wallet prompt.
  if (
    reviewed.get(request) !==
      JSON.stringify({ ...request, transaction: undefined }) ||
    bs58.encode(request.transaction.serializeMessage()) !== request.message
  )
    throw new Error("Prepared request changed. Review again.");
  const reviewedMessage = request.message;
  const reviewedMetadata = reviewed.get(request);
  const signed = await sign(
    Transaction.from(
      request.transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }),
    ),
  );
  activeCheck(active);
  if (
    reviewedMetadata !==
      JSON.stringify({ ...request, transaction: undefined }) ||
    bs58.encode(signed.serializeMessage()) !== reviewedMessage ||
    !signed.verifySignatures(true) ||
    signed.signatures.length !== 1 ||
    !signed.signature
  )
    throw new Error("Signed contents differ from the exact reviewed message.");
  const rawSigned = signed.serialize();
  const { transaction: _transaction, ...metadata } = request;
  const attempt: TransactionAttempt = {
    ...metadata,
    signature: bs58.encode(signed.signature),
    createdAt: Date.now(),
    status: "signed",
  };
  saveTransactionAttempt(attempt);
  // Once signed, preserve uncertainty even if the wallet changes, the request expires, or RPC fails.
  await assertDevnet(connection);
  activeCheck(active);
  if (
    (await connection.getBlockHeight("confirmed")) >
    request.lastValidBlockHeight
  )
    throw new Error("Signed request expired. Reconcile its saved identifier.");
  activeCheck(active);
  attempt.status = "pending";
  saveTransactionAttempt(attempt);
  const signature = await connection.sendRawTransaction(rawSigned, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
    maxRetries: 0,
    minContextSlot: request.minContextSlot,
  });
  if (signature !== attempt.signature)
    throw new Error("RPC identifier differs. Reconcile the saved transaction.");
  return attempt;
}
export async function reconcileRequest(
  connection: Connection,
  attempt: TransactionAttempt,
): Promise<TransactionAttempt> {
  await assertDevnet(connection);
  const statuses = await connection.getSignatureStatuses([attempt.signature], {
    searchTransactionHistory: true,
  });
  const status = statuses.value[0];
  const next = {
    ...attempt,
    status: "pending" as TransactionAttempt["status"],
  };
  if (
    status?.confirmationStatus === "confirmed" ||
    status?.confirmationStatus === "finalized"
  ) {
    const receipt = await connection.getTransaction(attempt.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (receipt?.meta && "instructions" in receipt.transaction.message) {
      const tx = Transaction.populate(
        receipt.transaction.message,
        receipt.transaction.signatures,
      );
      if (
        receipt.meta.err === undefined ||
        receipt.transaction.signatures[0] !== attempt.signature ||
        bs58.encode(tx.serializeMessage()) !== attempt.message ||
        attempt.message !== expectedMessage(attempt) ||
        !tx.verifySignatures(true)
      )
        throw new Error("Execution receipt does not match the saved request.");
      const meta = receipt.meta;
      const sender = receipt.transaction.message.accountKeys.findIndex(
        (k) => k.toBase58() === attempt.owner,
      );
      const recipient = receipt.transaction.message.accountKeys.findIndex(
        (k) => k.toBase58() === attempt.recipient,
      );
      const senderChange = meta.postBalances[sender] - meta.preBalances[sender];
      const recipientChange =
        recipient < 0
          ? null
          : meta.postBalances[recipient] - meta.preBalances[recipient];
      if (
        !Number.isSafeInteger(meta.fee) ||
        meta.fee < 0 ||
        meta.fee > MAX_FEE_LAMPORTS
      )
        throw new Error("Receipt fee outside reviewed limits.");
      if (
        !meta.err &&
        (senderChange !==
          -meta.fee - (attempt.action === "transfer" ? TRANSFER_LAMPORTS : 0) ||
          (attempt.action === "transfer" &&
            recipientChange !== TRANSFER_LAMPORTS))
      )
        throw new Error(
          "Recorded balance changes do not match expected effects.",
        );
      next.status = meta.err ? "failed" : "confirmed";
      next.receipt = { fee: meta.fee, senderChange, recipientChange };
    }
  } else if (
    !status &&
    (await connection.getBlockHeight("finalized")) >
      attempt.lastValidBlockHeight
  ) {
    const finalCheck = await connection.getSignatureStatuses(
      [attempt.signature],
      { searchTransactionHistory: true },
    );
    if (!finalCheck.value[0]) next.status = "expired";
  }
  saveTransactionAttempt(next);
  return next;
}
