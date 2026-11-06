import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { explorerTxUrl } from '../lib/constants'
import type { MissionEngine } from '../engine/useMissionEngine'
import { CastSpellAction } from './actions/CastSpellAction'
import { ConnectWalletAction } from './actions/ConnectWalletAction'
import { FaucetAction } from './actions/FaucetAction'
import { LinkAction } from './actions/LinkAction'
import { ManualConfirmAction } from './actions/ManualConfirmAction'
import { SubmitFlagAction } from './actions/SubmitFlagAction'
import { FinalBadge } from './FinalBadge'

type Props = {
  engine: MissionEngine
}

export function ActionZone({ engine }: Props) {
  const wallet = useWallet()
  const {
    step,
    status,
    failReason,
    signature,
    balanceLamports,
    canGoNext,
    confirmManual,
    runCast,
    runFlag,
    goNext,
    playAgain,
  } = engine

  const hint =
    status === 'failed' && failReason
      ? step.onFail?.[failReason]?.line
      : null

  return (
    <section className="action-zone flex w-full flex-col gap-4 rounded-[var(--radius-lg)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div>
        <p className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[var(--pink-400)]">
          Step {step.id}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink-900)]">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-700)] sm:text-base">
          {step.body}
        </p>
      </div>

      <div className="min-h-[4.5rem]">
        {step.action === 'none' && step.id === '4.3' && signature && (
          <SignatureBlock signature={signature} />
        )}

        {step.action === 'manual' && (
          <ManualConfirmAction
            label={step.manualLabel ?? 'I did it'}
            disabled={status === 'passed'}
            onConfirm={confirmManual}
          />
        )}

        {step.action === 'link' && step.check === 'walletInstalled' && (
          <LinkAction
            href={step.href ?? 'https://phantom.app/download'}
            label="Download Phantom"
            hint="After installing, refresh this page so I can see your wand."
          />
        )}

        {step.action === 'link' && step.id === '5.1' && (
          <div className="flex flex-col gap-3">
            <LinkAction
              href={
                signature
                  ? explorerTxUrl(signature)
                  : 'https://explorer.solana.com/?cluster=devnet'
              }
              label="Open Solana Explorer"
              hint="Keep cluster=devnet. Scroll to Program Instruction Logs."
            />
            <ManualConfirmAction
              label={step.manualLabel ?? 'I found the flag'}
              disabled={status === 'passed'}
              onConfirm={confirmManual}
            />
          </div>
        )}

        {step.action === 'connect' && <ConnectWalletAction />}

        {step.action === 'faucet' && (
          <FaucetAction
            faucetUrl={step.href ?? 'https://faucet.solana.com/'}
            balanceLamports={balanceLamports}
          />
        )}

        {step.action === 'cast' && (
          <CastSpellAction
            loading={status === 'checking'}
            disabled={!wallet.connected}
            onCast={() => {
              void runCast()
            }}
          />
        )}

        {step.action === 'flag' && (
          <SubmitFlagAction
            checking={status === 'checking'}
            onSubmit={(v) => {
              void runFlag(v)
            }}
          />
        )}

        {step.action === 'finale' && <FinalBadge onPlayAgain={playAgain} />}
      </div>

      {hint && (
        <p className="rounded-[var(--radius-md)] bg-[var(--pink-100)] px-3 py-2 text-sm text-[var(--ink-900)]">
          {hint}
        </p>
      )}

      {step.action !== 'finale' && (
        <div className="mt-auto flex justify-end pt-2">
          <button
            type="button"
            className="btn-next"
            disabled={!canGoNext}
            onClick={goNext}
          >
            Next ▸
          </button>
        </div>
      )}
    </section>
  )
}

function SignatureBlock({ signature }: { signature: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(signature)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="break-all font-mono text-xs text-[var(--ink-900)]">{signature}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={copy}>
          {copied ? 'Copied!' : 'Copy signature'}
        </button>
        <a
          href={explorerTxUrl(signature)}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary inline-flex items-center no-underline"
        >
          Open in Explorer
        </a>
      </div>
    </div>
  )
}
