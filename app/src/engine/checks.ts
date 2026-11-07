import type { Connection } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { verifyFlag } from "../lib/flag";
import { sendTriggerMission } from "../lib/program";
export type CheckResult =
  | { ok: true; signature?: string }
  | { ok: false; reason: string; signature?: string };
export function classifyTxError(error: unknown): string {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  if (/reject|cancel|declin/.test(message)) return "rejected";
  if (
    /insufficient|no record of a prior credit|attempt to debit|not enough sol/.test(
      message,
    )
  )
    return "insufficient";
  if (/execution failed|custom program error/.test(message)) return "execution";
  if (/incorrect cluster|mainnet/.test(message)) return "network";
  if (/program unavailable/.test(message)) return "program";
  if (/expired|blockhash|block height/.test(message)) return "expired";
  if (/fetch|network|429|401|403|timeout|timed out/.test(message)) return "rpc";
  return "unknown";
}
export async function castSpell(
  connection: Connection,
  wallet: WalletContextState,
): Promise<CheckResult> {
  try {
    return {
      ok: true,
      signature: await sendTriggerMission(connection, wallet),
    };
  } catch (error) {
    const signature =
      error &&
      typeof error === "object" &&
      "signature" in error &&
      typeof error.signature === "string"
        ? error.signature
        : undefined;
    return { ok: false, reason: classifyTxError(error), signature };
  }
}
export async function checkFlag(input: string): Promise<CheckResult> {
  return (await verifyFlag(input))
    ? { ok: true }
    : { ok: false, reason: "invalid" };
}
