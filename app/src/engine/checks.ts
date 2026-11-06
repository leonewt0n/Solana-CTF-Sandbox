import { WalletReadyState } from '@solana/wallet-adapter-base'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import type { Connection, PublicKey } from '@solana/web3.js'
import { verifyFlag } from '../lib/flag'
import { sendTriggerMission } from '../lib/program'

export type CheckResult =
  | { ok: true; signature?: string }
  | { ok: false; reason: string }

export function isPhantomInstalled(wallet: WalletContextState): boolean {
  const phantom = wallet.wallets.find((w) => w.adapter.name === 'Phantom')
  if (!phantom) return false
  return (
    phantom.readyState === WalletReadyState.Installed ||
    phantom.readyState === WalletReadyState.Loadable
  )
}

export function isWalletConnected(wallet: WalletContextState): boolean {
  return Boolean(wallet.connected && wallet.publicKey)
}

export async function hasPositiveBalance(
  connection: Connection,
  publicKey: PublicKey | null,
): Promise<CheckResult> {
  if (!publicKey) return { ok: false, reason: 'zero' }
  const lamports = await connection.getBalance(publicKey, 'confirmed')
  return lamports > 0 ? { ok: true } : { ok: false, reason: 'zero' }
}

function classifyTxError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  const lower = message.toLowerCase()

  if (
    lower.includes('user rejected') ||
    lower.includes('rejected the request') ||
    lower.includes('cancelled') ||
    lower.includes('canceled')
  ) {
    return 'rejected'
  }
  if (
    lower.includes('insufficient') ||
    lower.includes('no record of a prior credit') ||
    lower.includes('attempt to debit') ||
    lower.includes('not enough sol')
  ) {
    return 'insufficient'
  }
  if (
    lower.includes('custom program error') ||
    lower.includes('incorrect cluster') ||
    lower.includes('mainnet') ||
    lower.includes('network') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('blockhash not found')
  ) {
    return 'network'
  }
  return 'unknown'
}

export async function castSpell(
  connection: Connection,
  wallet: WalletContextState,
): Promise<CheckResult> {
  try {
    const signature = await sendTriggerMission(connection, wallet)
    return { ok: true, signature }
  } catch (err) {
    return { ok: false, reason: classifyTxError(err) }
  }
}

export async function checkFlag(input: string): Promise<CheckResult> {
  const ok = await verifyFlag(input)
  return ok ? { ok: true } : { ok: false, reason: 'invalid' }
}
