import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, TRIGGER_MISSION_DISCRIMINATOR } from "./constants";
import { assertDevnet } from "./network";

export async function prepareMission(
  connection: Connection,
  publicKey: PublicKey,
) {
  // Do not trust an endpoint's name: verify its actual network before asking for a signature.
  await assertDevnet(connection);
  const program = await connection.getAccountInfo(PROGRAM_ID, "confirmed");
  if (!program?.executable)
    throw new Error("Teaching program unavailable on Devnet");
  const {
    context: { slot: minContextSlot },
    value: { blockhash, lastValidBlockHeight },
  } = await connection.getLatestBlockhashAndContext("confirmed");
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: publicKey,
  }).add(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from(TRIGGER_MISSION_DISCRIMINATOR),
    }),
  );
  const fee = await connection.getFeeForMessage(
    transaction.compileMessage(),
    "confirmed",
  );
  if (fee.value === null)
    throw new Error("Fee estimate unavailable; please retry");
  return {
    transaction,
    minContextSlot,
    blockhash,
    lastValidBlockHeight,
    feeLamports: fee.value,
  };
}

export async function sendTriggerMission(
  connection: Connection,
  wallet: WalletContextState,
): Promise<string> {
  if (!wallet.publicKey || !wallet.sendTransaction)
    throw new Error("Connect a wallet first");
  const { transaction, minContextSlot, blockhash, lastValidBlockHeight } =
    await prepareMission(connection, wallet.publicKey);
  const signature = await wallet.sendTransaction(transaction, connection, {
    minContextSlot,
  });
  try {
    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (confirmation.value.err)
      throw new Error(
        "Transaction execution failed: " +
          JSON.stringify(confirmation.value.err),
      );
  } catch (error) {
    // Preserve the receipt even if execution failed or confirmation was interrupted.
    const failure = error instanceof Error ? error : new Error(String(error));
    throw Object.assign(failure, { signature });
  }
  return signature;
}
