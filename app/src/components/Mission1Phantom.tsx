export function Mission1Phantom() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">
        Mission 1 — Create a Phantom wallet
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Before you can talk to Solana, you need a wallet. Phantom is a beginner-friendly
        browser extension that holds your keys and signs transactions.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>
          Open{' '}
          <a
            className="font-medium text-emerald-700 underline"
            href="https://phantom.app/download"
            target="_blank"
            rel="noreferrer"
          >
            phantom.app/download
          </a>{' '}
          and install the extension for your browser.
        </li>
        <li>Click <strong>Create a new wallet</strong> and set a password for this device.</li>
        <li>
          Write down your Secret Recovery Phrase offline and store it safely — never share
          it or paste it into a website.
        </li>
        <li>Finish setup, then come back here and click <strong>Select Wallet</strong>.</li>
      </ol>

      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Already have Phantom? You&apos;re done with Mission 1 — continue when you&apos;re
        ready for later missions.
      </p>
    </section>
  )
}
