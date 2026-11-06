import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function ConnectWalletAction() {
  return (
    <div className="flex flex-col items-start gap-3">
      <WalletMultiButton />
      <p className="text-sm text-[var(--ink-700)]">
        Pick Phantom (or another Solana wallet) and approve the connection.
      </p>
    </div>
  )
}
