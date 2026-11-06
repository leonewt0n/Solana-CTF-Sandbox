type Props = {
  onPlayAgain: () => void
}

export function FinalBadge({ onPlayAgain }: Props) {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="rounded-[var(--radius-lg)] border-2 border-[var(--gold-400)] bg-gradient-to-br from-white to-[var(--pink-100)] px-5 py-4 shadow-[var(--shadow-soft)]">
        <p className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-widest text-[var(--gold-400)]">
          Badge unlocked
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink-900)]">
          Certified by Fairydev
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--ink-700)]">
          <li>Wallet &amp; Secret Recovery Phrase</li>
          <li>Devnet &amp; faucet dust</li>
          <li>Signed transaction + signature</li>
          <li>Program Instruction Logs / flag</li>
        </ul>
      </div>
      <button type="button" className="btn-secondary" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
