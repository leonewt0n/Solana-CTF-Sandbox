import { PublicKey } from '@solana/web3.js'

/** Anchor discriminator for `global:trigger_mission` */
export const TRIGGER_MISSION_DISCRIMINATOR = Uint8Array.from([
  142, 145, 175, 30, 211, 253, 181, 208,
])

/** SHA-256 hex of `CTF{r3ad_th3_l0gs}` — never store the plaintext flag in the client. */
export const FLAG_HASH_HEX =
  'd3e07683548a0f56079a72f79d9ceaf3254140b1298a354f1f9a6e262507192e'

export const DEVNET_RPC =
  import.meta.env.VITE_RPC_URL ?? 'https://api.devnet.solana.com'

export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID ?? '4N7BDpSPfdcfK7LSoZBRGUdabSY1Z5thjyUH2hSxBPQa',
)

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`
}

export function explorerProgramUrl(programId: string = PROGRAM_ID.toBase58()): string {
  return `https://explorer.solana.com/address/${programId}?cluster=devnet`
}
