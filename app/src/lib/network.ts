import type { Connection } from "@solana/web3.js";
export async function assertDevnet(connection: Connection): Promise<void> {
  if (
    (await connection.getGenesisHash()) !==
    "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
  ) {
    throw new Error("Incorrect cluster: this course requires Solana Devnet");
  }
}
