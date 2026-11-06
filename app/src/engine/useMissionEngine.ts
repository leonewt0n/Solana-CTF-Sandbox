import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  flattenSteps,
  MISSIONS,
  type FairyLine,
  type Mood,
  type Step,
} from '../content/missions'
import {
  castSpell,
  checkFlag,
  isPhantomInstalled,
  isWalletConnected,
} from './checks'

export type StepStatus = 'idle' | 'checking' | 'passed' | 'failed'

export type EngineState = {
  stepIndex: number
  status: StepStatus
  failReason: string | null
  signature: string | null
  balanceLamports: number | null
  fairyOverride: FairyLine | null
  showSparkles: boolean
}

type Persisted = {
  stepIndex: number
  signature: string | null
}

const STORAGE_PREFIX = 'fairydev:v1:'

function storageKey(pubkey: string | null): string {
  return `${STORAGE_PREFIX}${pubkey ?? 'anon'}`
}

function readProgress(pubkey: string | null): Persisted | null {
  try {
    const raw = localStorage.getItem(storageKey(pubkey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Persisted
    if (typeof parsed.stepIndex !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeProgress(pubkey: string | null, data: Persisted) {
  try {
    localStorage.setItem(storageKey(pubkey), JSON.stringify(data))
  } catch {
    // ignore quota / private mode
  }
}

function missionIndexForStep(stepIndex: number): number {
  let remaining = stepIndex
  for (let i = 0; i < MISSIONS.length; i++) {
    const len = MISSIONS[i].steps.length
    if (remaining < len) return i
    remaining -= len
  }
  return MISSIONS.length - 1
}

export function useMissionEngine() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const steps = useMemo(() => flattenSteps(), [])
  const pubkeyStr = wallet.publicKey?.toBase58() ?? null

  const [stepIndex, setStepIndex] = useState(0)
  const [status, setStatus] = useState<StepStatus>('idle')
  const [failReason, setFailReason] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null)
  const [fairyOverride, setFairyOverride] = useState<FairyLine | null>(null)
  const [showSparkles, setShowSparkles] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const pollRef = useRef<number | null>(null)

  const step: Step = steps[Math.min(stepIndex, steps.length - 1)]
  const missionIndex = missionIndexForStep(stepIndex)
  const mission = MISSIONS[missionIndex]
  const totalMissions = MISSIONS.length
  const completedMissions = Math.min(missionIndex, totalMissions)

  // hydrate from localStorage
  useEffect(() => {
    const saved = readProgress(pubkeyStr)
    if (saved) {
      setStepIndex(Math.max(0, Math.min(saved.stepIndex, steps.length - 1)))
      if (saved.signature) setSignature(saved.signature)
    }
    setStatus('idle')
    setFailReason(null)
    setFairyOverride(null)
    setHydrated(true)
  }, [pubkeyStr, steps.length])

  // persist
  useEffect(() => {
    if (!hydrated) return
    writeProgress(pubkeyStr, { stepIndex, signature })
  }, [hydrated, pubkeyStr, stepIndex, signature])

  const markPassed = useCallback((next?: FairyLine) => {
    setStatus('passed')
    setFailReason(null)
    if (next) {
      setFairyOverride(next)
      setShowSparkles(true)
      window.setTimeout(() => setShowSparkles(false), 1200)
    }
  }, [])

  const markFailed = useCallback((reason: string, line?: FairyLine) => {
    setStatus('failed')
    setFailReason(reason)
    if (line) setFairyOverride(line)
  }, [])

  const resetStepVisual = useCallback(() => {
    setStatus('idle')
    setFailReason(null)
    setFairyOverride(null)
  }, [])

  // Auto checks for passive steps
  useEffect(() => {
    if (!hydrated) return
    if (step.check === 'none') {
      setStatus('passed')
      return
    }
    if (step.check === 'manual') {
      // stay idle until user confirms (unless already passed)
      setStatus((s) => (s === 'passed' ? s : 'idle'))
      return
    }

    let cancelled = false

    async function runAuto() {
      if (step.check === 'walletInstalled') {
        if (isPhantomInstalled(wallet)) {
          if (!cancelled) markPassed(step.onPass)
        } else {
          if (!cancelled) {
            setStatus('idle')
            setFairyOverride(null)
          }
        }
        return
      }

      if (step.check === 'walletConnected') {
        if (isWalletConnected(wallet)) {
          if (!cancelled) markPassed(step.onPass)
        } else if (!cancelled) {
          setStatus((s) => (s === 'checking' ? s : 'idle'))
        }
        return
      }

      // balancePositive is handled by the subscription effect below
    }

    void runAuto()
    return () => {
      cancelled = true
    }
  }, [
    hydrated,
    step,
    wallet.connected,
    wallet.publicKey,
    wallet.wallets,
    markPassed,
  ])

  // Live balance subscription + poll fallback for faucet step
  useEffect(() => {
    if (!hydrated || step.check !== 'balancePositive' || !wallet.publicKey) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    const pubkey = wallet.publicKey
    let subId: number | null = null

    async function refresh() {
      try {
        const lamports = await connection.getBalance(pubkey, 'confirmed')
        setBalanceLamports(lamports)
        if (lamports > 0 && status !== 'passed') {
          markPassed(step.onPass)
        }
      } catch {
        // ignore transient RPC errors
      }
    }

    void refresh()
    subId = connection.onAccountChange(
      pubkey,
      (account) => {
        setBalanceLamports(account.lamports)
        if (account.lamports > 0) markPassed(step.onPass)
      },
      'confirmed',
    )

    pollRef.current = window.setInterval(() => {
      void refresh()
    }, 3000)

    return () => {
      if (subId !== null) {
        void connection.removeAccountChangeListener(subId)
      }
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [
    hydrated,
    step,
    wallet.publicKey,
    connection,
    markPassed,
    status,
  ])

  const confirmManual = useCallback(() => {
    markPassed(step.onPass)
  }, [markPassed, step.onPass])

  const runCast = useCallback(async () => {
    setStatus('checking')
    setFairyOverride({ mood: 'thinking', line: 'Casting… don’t blink.' })
    const result = await castSpell(connection, wallet)
    if (result.ok) {
      setSignature(result.signature ?? null)
      markPassed(step.onPass)
    } else {
      const line = step.onFail?.[result.reason] ?? step.onFail?.unknown
      markFailed(result.reason, line)
    }
  }, [connection, wallet, step, markPassed, markFailed])

  const runFlag = useCallback(
    async (value: string) => {
      setStatus('checking')
      setFairyOverride({ mood: 'thinking', line: 'Checking the wing…' })
      const result = await checkFlag(value)
      if (result.ok) {
        markPassed(step.onPass)
      } else {
        const line = step.onFail?.[result.reason] ?? step.onFail?.invalid
        markFailed(result.reason, line)
      }
    },
    [step, markPassed, markFailed],
  )

  const canGoNext = status === 'passed' || step.check === 'none'

  const goNext = useCallback(() => {
    if (!canGoNext) return
    if (stepIndex >= steps.length - 1) return
    setStepIndex((i) => i + 1)
    resetStepVisual()
  }, [canGoNext, stepIndex, steps.length, resetStepVisual])

  const playAgain = useCallback(() => {
    setStepIndex(0)
    setSignature(null)
    resetStepVisual()
    writeProgress(pubkeyStr, { stepIndex: 0, signature: null })
  }, [pubkeyStr, resetStepVisual])

  const displayMood: Mood = fairyOverride?.mood ?? step.fairy.mood
  const displayLine: string = fairyOverride?.line ?? step.fairy.line

  return {
    steps,
    step,
    stepIndex,
    mission,
    missionIndex,
    totalMissions,
    completedMissions,
    status,
    failReason,
    signature,
    balanceLamports,
    showSparkles,
    displayMood,
    displayLine,
    canGoNext,
    confirmManual,
    runCast,
    runFlag,
    goNext,
    playAgain,
    setSignature: setSignature as Dispatch<SetStateAction<string | null>>,
    phantomInstalled: isPhantomInstalled(wallet),
    walletConnected: isWalletConnected(wallet),
  }
}

export type MissionEngine = ReturnType<typeof useMissionEngine>
