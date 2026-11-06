import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function WalletBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Solana Devnet
        </p>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
          On-Chain CTF Sandbox
        </h1>
      </div>
      <WalletMultiButton />
    </header>
  )
}
