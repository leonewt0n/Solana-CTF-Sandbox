const STEPS = [
  {
    title: 'Switch wallet to Devnet',
    body: 'In Phantom / Solflare / Backpack, set the network to Devnet (not Mainnet).',
  },
  {
    title: 'Get free Devnet SOL',
    body: 'Use the Solana faucet if your balance is empty — you need a tiny amount to pay fees.',
  },
  {
    title: 'Trigger the mission',
    body: 'Connect your wallet and click Trigger Mission Instruction. Approve the transaction.',
  },
  {
    title: 'Open the explorer link',
    body: 'Use the deep-link after the tx succeeds. Keep cluster=devnet in the URL.',
  },
  {
    title: 'Read Program Logs',
    body: 'Scroll to Program Instruction Logs and look for a string that looks like CTF{...}.',
  },
  {
    title: 'Submit the flag',
    body: 'Paste the full flag (including CTF{ and }) into the form below to verify.',
  },
]

export function Hints() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Guided hints</h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
              {index + 1}
            </span>
            <div>
              <p className="font-medium text-slate-900">{step.title}</p>
              <p className="text-sm text-slate-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-slate-600">
        Need SOL?{' '}
        <a
          className="font-medium text-emerald-700 underline"
          href="https://faucet.solana.com/"
          target="_blank"
          rel="noreferrer"
        >
          Solana Faucet
        </a>
      </p>
    </section>
  )
}
