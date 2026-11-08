import type { Connection, PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  prepareRequest,
  submitRequest,
  reconcileRequest,
  withTransactionLock,
  type PreparedRequest,
} from "./transactionLifecycle";
export const prepareMission = (connection: Connection, owner: PublicKey) =>
  prepareRequest(connection, owner, "program");
/** Callers must present and retain a prepared preview. Never silently rebuild it at signing. */
export async function sendTriggerMission(
  connection: Connection,
  wallet: WalletContextState,
  prepared?: PreparedRequest,
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction)
    throw new Error("Connect a wallet supporting transaction signing first");
  if (!prepared || prepared.action !== "program")
    throw new Error("Review a prepared program request first");
  return withTransactionLock(prepared.owner, async () => {
    const attempt = await submitRequest(
      connection,
      prepared,
      (tx) => wallet.signTransaction!(tx),
      () => wallet.connected && wallet.publicKey?.toBase58() === prepared.owner,
    );
    const checked = await reconcileRequest(connection, attempt);
    if (checked.status !== "confirmed")
      throw Object.assign(
        new Error(
          "Receipt unresolved or execution failed; reconcile before retrying",
        ),
        { signature: checked.signature },
      );
    return checked.signature;
  });
}
