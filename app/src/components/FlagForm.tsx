import { useState, type FormEvent } from 'react'
import { verifyFlag } from '../lib/flag'

export function FlagForm() {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'bad'>('idle')
  const [checking, setChecking] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setChecking(true)
    setStatus('idle')
    try {
      const ok = await verifyFlag(value)
      setStatus(ok ? 'ok' : 'bad')
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Submit flag</h2>
      <p className="mt-2 text-sm text-slate-600">
        Paste the flag you found in the Program Instruction Logs.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setStatus('idle')
          }}
          placeholder="CTF{...}"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none ring-emerald-500 focus:ring-2"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={checking || !value.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          {checking ? 'Checking…' : 'Verify'}
        </button>
      </form>

      {status === 'ok' && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          Correct — you read the on-chain logs. Mission complete.
        </p>
      )}
      {status === 'bad' && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Not quite. Open the explorer logs again and copy the full{' '}
          <code className="font-mono">CTF{'{...}'}</code> string.
        </p>
      )}
    </section>
  )
}
