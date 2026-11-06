import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'

type Props = {
  faucetUrl: string
  balanceLamports: number | null
}

export function FaucetAction({ faucetUrl, balanceLamports }: Props) {
  const { publicKey } = useWallet()
  const [copied, setCopied] = useState(false)
  const address = publicKey?.toBase58() ?? ''
  const sol =
    balanceLamports === null ? '—' : (balanceLamports / 1_000_000_000).toFixed(4)

  async function copy() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[var(--radius-md)] border border-pink-200/80 bg-white/80 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-700)]">
          Your address
        </p>
        <p className="mt-1 break-all font-mono text-xs text-[var(--ink-900)]">
          {address || 'Connect a wallet first'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={copy} disabled={!address}>
          {copied ? 'Copied!' : 'Copy address'}
        </button>
        <a
          href={faucetUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary inline-flex items-center justify-center no-underline"
        >
          Open faucet
        </a>
      </div>

      <p className="font-[family-name:var(--font-display)] text-sm text-[var(--ink-900)]">
        Balance: <span className="text-[var(--pink-400)]">{sol} SOL</span>
      </p>
    </div>
  )
}
