/** Boundary for the project's existing legacy wallet-adapter integration. */
import bs58 from "bs58";
import {
  PublicKey,
  SystemProgram,
  SystemInstruction,
  Transaction,
  VersionedTransaction,
  type Connection,
} from "@solana/web3.js";
import { LIVE_SCAMS } from "../content/liveScams";
import { assertDevnet } from "./network";

export const LIVE_AMOUNT = 1_000_000;
export const LIVE_MAX_FEE = 50_000;
export const LIVE_STORAGE_PREFIX = "solana-learn:live-devnet:v1:";
// Canonical teaching program PDA, seed "scam-training-sink-v1" (bump 255).
// Keep the public destination stable even when the ordinary course program is overridden.
export const TRAINING_DESTINATION = new PublicKey(
  "Gtvzd8EYDxhXL6JSKDNoNwfJ5menLSqK3L4gJnuDYBuN",
);
export type Attempt = {
  owner: string;
  scenario: string;
  network: "devnet";
  amount: number;
  feeLamports: number;
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
  createdAt: number;
  status: "signed" | "pending" | "confirmed" | "failed" | "expired";
};
export type PreparedTransfer = {
  owner: string;
  scenario: string;
  transaction: Transaction;
  blockhash: string;
  lastValidBlockHeight: number;
  minContextSlot: number;
  feeLamports: number;
};
const terminal = (a: Attempt) =>
  ["confirmed", "failed", "expired"].includes(a.status);
const attemptKey = (owner: string, scenario: string) =>
  LIVE_STORAGE_PREFIX + owner + ":" + scenario;

export function readAttempt(owner: string, scenario: string): Attempt | null {
  const raw = localStorage.getItem(attemptKey(owner, scenario));
  if (!raw) return null;
  let a: Attempt;
  try {
    a = JSON.parse(raw);
  } catch {
    throw new Error(
      "The saved training receipt is unreadable. No new transfer will be requested.",
    );
  }
  if (
    !a ||
    a.owner !== owner ||
    a.scenario !== scenario ||
    a.network !== "devnet" ||
    LIVE_SCAMS[scenario]?.kind !== "transfer" ||
    a.amount !== LIVE_AMOUNT ||
    !Number.isSafeInteger(a.feeLamports) ||
    a.feeLamports < 0 ||
    a.feeLamports > LIVE_MAX_FEE ||
    typeof a.signature !== "string" ||
    !/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(a.signature) ||
    typeof a.blockhash !== "string" ||
    !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a.blockhash) ||
    !Number.isSafeInteger(a.lastValidBlockHeight) ||
    a.lastValidBlockHeight < 0 ||
    !Number.isSafeInteger(a.createdAt) ||
    !["signed", "pending", "confirmed", "failed", "expired"].includes(a.status)
  ) {
    throw new Error(
      "The saved training receipt is invalid. No new transfer will be requested.",
    );
  }
  return a;
}
export function saveAttempt(a: Attempt) {
  const key = attemptKey(a.owner, a.scenario);
  const value = JSON.stringify(a);
  localStorage.setItem(key, value);
  if (localStorage.getItem(key) !== value)
    throw new Error("Could not save the training receipt. Submission stopped.");
}
export function unresolvedAttempt(owner: string) {
  for (const [scenario, config] of Object.entries(LIVE_SCAMS)) {
    if (config.kind !== "transfer") continue;
    const a = readAttempt(owner, scenario);
    if (a && !terminal(a)) return a;
  }
  return null;
}
export function assertTrainingTransfer(
  tx: Transaction,
  owner: PublicKey,
  blockhash: string,
) {
  if (
    !tx.feePayer?.equals(owner) ||
    tx.recentBlockhash !== blockhash ||
    tx.nonceInfo ||
    tx.instructions.length !== 1
  )
    throw new Error(
      "Training transaction changed. Signing or submission stopped.",
    );
  const ix = tx.instructions[0];
  if (
    !ix.programId.equals(SystemProgram.programId) ||
    ix.keys.length !== 2 ||
    ix.data.length !== 12 ||
    !ix.keys[0].pubkey.equals(owner) ||
    !ix.keys[0].isSigner ||
    !ix.keys[0].isWritable ||
    !ix.keys[1].pubkey.equals(TRAINING_DESTINATION) ||
    ix.keys[1].isSigner ||
    !ix.keys[1].isWritable ||
    SystemInstruction.decodeInstructionType(ix) !== "Transfer"
  )
    throw new Error("Unexpected training instruction. Submission stopped.");
  const transfer = SystemInstruction.decodeTransfer(ix);
  if (transfer.lamports !== BigInt(LIVE_AMOUNT))
    throw new Error("Training amount changed. Submission stopped.");
}
function checkActive(active: () => boolean) {
  if (!active())
    throw new Error(
      "The wallet or lesson changed. No new submission will be made.",
    );
}
export async function prepareTrainingTransfer(
  connection: Connection,
  owner: PublicKey,
  scenario: string,
): Promise<PreparedTransfer> {
  if (LIVE_SCAMS[scenario]?.kind !== "transfer")
    throw new Error("This lesson has no live transfer.");
  await assertDevnet(connection);
  if (unresolvedAttempt(owner.toBase58()))
    throw new Error(
      "Check the pending training receipt before starting another transfer.",
    );
  const { context, value } =
    await connection.getLatestBlockhashAndContext("confirmed");
  const transaction = new Transaction({
    feePayer: owner,
    recentBlockhash: value.blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: TRAINING_DESTINATION,
      lamports: LIVE_AMOUNT,
    }),
  );
  assertTrainingTransfer(transaction, owner, value.blockhash);
  const fee = await connection.getFeeForMessage(
    transaction.compileMessage(),
    "confirmed",
  );
  if (
    fee.value === null ||
    !Number.isSafeInteger(fee.value) ||
    fee.value < 0 ||
    fee.value > LIVE_MAX_FEE
  )
    throw new Error(
      "The fee estimate is unavailable or exceeds the 0.00005 SOL training limit.",
    );
  const balance = await connection.getBalance(owner, "confirmed");
  if (balance < LIVE_AMOUNT + fee.value)
    throw new Error(
      "Not enough Devnet SOL for the 0.001 SOL transfer and fee. Use a Devnet faucet; do not buy test SOL.",
    );
  const simulation = await connection.simulateTransaction(
    new VersionedTransaction(transaction.compileMessage()),
    {
      sigVerify: false,
      commitment: "confirmed",
      minContextSlot: context.slot,
    },
  );
  if (simulation.value.err)
    throw new Error(
      "The Devnet simulation failed. No wallet signature was requested.",
    );
  return {
    owner: owner.toBase58(),
    scenario,
    transaction,
    minContextSlot: context.slot,
    feeLamports: fee.value,
    ...value,
  };
}

/** The signed identifier is durably saved before any broadcast. No automatic signing or retry. */
export async function submitTrainingTransfer(
  connection: Connection,
  prepared: PreparedTransfer,
  sign: (transaction: Transaction) => Promise<Transaction>,
  active: () => boolean,
): Promise<Attempt> {
  checkActive(active);
  await assertDevnet(connection);
  checkActive(active);
  if (unresolvedAttempt(prepared.owner))
    throw new Error("A training receipt is still pending.");
  const owner = new PublicKey(prepared.owner);
  assertTrainingTransfer(prepared.transaction, owner, prepared.blockhash);
  if (
    !Number.isSafeInteger(prepared.feeLamports) ||
    prepared.feeLamports > LIVE_MAX_FEE ||
    prepared.feeLamports < 0 ||
    LIVE_SCAMS[prepared.scenario]?.kind !== "transfer"
  )
    throw new Error("Invalid training request.");
  if (
    (await connection.getBlockHeight("confirmed")) >
    prepared.lastValidBlockHeight
  )
    throw new Error(
      "This preview expired. Prepare a fresh request before signing.",
    );
  checkActive(active);
  const expectedMessage = prepared.transaction.serializeMessage();
  const signed = await sign(prepared.transaction);
  checkActive(active);
  assertTrainingTransfer(signed, owner, prepared.blockhash);
  if (
    !signed.serializeMessage().equals(expectedMessage) ||
    !signed.verifySignatures(true) ||
    signed.signatures.length !== 1 ||
    !signed.signature
  )
    throw new Error(
      "The signed transaction did not match the reviewed request.",
    );
  const attempt: Attempt = {
    owner: prepared.owner,
    scenario: prepared.scenario,
    network: "devnet",
    amount: LIVE_AMOUNT,
    feeLamports: prepared.feeLamports,
    signature: bs58.encode(signed.signature),
    blockhash: prepared.blockhash,
    lastValidBlockHeight: prepared.lastValidBlockHeight,
    createdAt: Date.now(),
    status: "signed",
  };
  saveAttempt(attempt);
  await assertDevnet(connection);
  checkActive(active);
  // Persist uncertainty before entering the RPC call: a timeout may still mean it was broadcast.
  attempt.status = "pending";
  saveAttempt(attempt);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 0,
    minContextSlot: prepared.minContextSlot,
  });
  if (signature !== attempt.signature)
    throw new Error(
      "The RPC returned a different identifier. Check the saved receipt before trying again.",
    );
  return attempt;
}

export async function refreshTrainingAttempt(
  connection: Connection,
  attempt: Attempt,
): Promise<Attempt> {
  await assertDevnet(connection);
  const response = await connection.getSignatureStatuses([attempt.signature], {
    searchTransactionHistory: true,
  });
  const status = response.value[0];
  const next: Attempt = { ...attempt, status: "pending" };
  if (
    status?.confirmationStatus === "confirmed" ||
    status?.confirmationStatus === "finalized"
  ) {
    const receipt = await connection.getTransaction(attempt.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (receipt?.meta && "instructions" in receipt.transaction.message) {
      if (receipt.meta.err === undefined)
        throw new Error(
          "The execution receipt is incomplete. Check again before making another transfer.",
        );
      const tx = Transaction.populate(
        receipt.transaction.message,
        receipt.transaction.signatures,
      );
      assertTrainingTransfer(
        tx,
        new PublicKey(attempt.owner),
        attempt.blockhash,
      );
      if (
        receipt.transaction.signatures[0] !== attempt.signature ||
        !tx.verifySignatures(true)
      )
        throw new Error("The receipt does not match the saved signed request.");
      next.status = receipt.meta.err ? "failed" : "confirmed";
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
  saveAttempt(next);
  return next;
}

export function trainingMessage(
  origin: string,
  scenario: string,
  owner: string,
  nonce: string,
) {
  if (LIVE_SCAMS[scenario]?.kind !== "message")
    throw new Error("This lesson has no training message.");
  return `SOLANA LEARN — TRAINING ONLY\nOrigin: ${origin}\nScenario: ${scenario}\nPractice account: ${owner}\nNonce: ${nonce}\n\nThis is an off-chain educational message. It is not a login, payment, approval, or permission grant. No service should accept it as authentication.`;
}
export async function signTrainingMessage(
  connection: Connection,
  owner: PublicKey,
  message: string,
  sign: (bytes: Uint8Array) => Promise<Uint8Array>,
  active: () => boolean,
) {
  const nonce = /^Nonce: ([a-f0-9-]{36})$/m.exec(message)?.[1];
  if (
    !nonce ||
    message !==
      trainingMessage(
        window.location.origin,
        "scam.message",
        owner.toBase58(),
        nonce,
      )
  )
    throw new Error(
      "The training message changed. No signature was requested.",
    );
  await assertDevnet(connection);
  checkActive(active);
  // Check browser verification support before asking the wallet to do anything.
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(owner.toBytes()),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
  } catch {
    throw new Error(
      "This browser cannot verify Ed25519 training signatures. Use Preview mode or a compatible browser; no wallet request was made.",
    );
  }
  const bytes = new TextEncoder().encode(message);
  const signed = await sign(new Uint8Array(bytes));
  checkActive(active);
  if (
    !(await crypto.subtle.verify("Ed25519", key, new Uint8Array(signed), bytes))
  )
    throw new Error("The training message signature could not be verified.");
}

/** Web Locks serialize attempts across same-origin tabs; unsupported browsers fail closed. */
export async function withTrainingLock<T>(
  owner: string,
  task: () => Promise<T>,
): Promise<T> {
  if (!navigator.locks?.request)
    throw new Error(
      "This browser cannot safely coordinate wallet practice across tabs. Use Preview mode or a browser with Web Locks support.",
    );
  return navigator.locks.request(
    "solana-learn:live:" + owner,
    { ifAvailable: true },
    async (lock) => {
      if (!lock)
        throw new Error(
          "Another tab is preparing a wallet exercise. Finish or cancel that request first.",
        );
      return task();
    },
  );
}
