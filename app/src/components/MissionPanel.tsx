import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { explorerProgramUrl, explorerTxUrl, PROGRAM_ID } from '../lib/constants'
import { sendTriggerMission } from '../lib/program'

export function MissionPanel() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onTrigger() {
    setError(null)
    setLoading(true)
    try {
      const sig = await sendTriggerMission(connection, wallet)
      setSignature(sig)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Mission 1</h2>
      <p className="mt-2 text-sm text-slate-600">
        Call a deliberately chatty Solana program. The flag is written into the
        transaction&apos;s program logs — not hidden in this webpage.
      </p>

      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-slate-700">Program ID</dt>
          <dd>
            <a
              className="break-all text-emerald-700 underline"
              href={explorerProgramUrl()}
              target="_blank"
              rel="noreferrer"
            >
              {PROGRAM_ID.toBase58()}
            </a>
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onTrigger}
        disabled={!wallet.connected || loading}
        className="mt-5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? 'Sending…' : 'Trigger Mission Instruction'}
      </button>

      {!wallet.connected && (
        <p className="mt-3 text-sm text-amber-700">
          Connect a wallet on Devnet to continue.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {signature && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-900">Transaction confirmed</p>
          <p className="mt-1 break-all text-emerald-800">{signature}</p>
          <a
            className="mt-2 inline-block font-semibold text-emerald-700 underline"
            href={explorerTxUrl(signature)}
            target="_blank"
            rel="noreferrer"
          >
            Open in Solana Explorer (Devnet)
          </a>
        </div>
      )}
    </section>
  )
}
