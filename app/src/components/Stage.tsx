import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useMissionEngine } from '../engine/useMissionEngine'
import { ActionZone } from './ActionZone'
import { Fairy } from './Fairy'
import { Sparkles } from './Sparkles'
import { SpeechBubble } from './SpeechBubble'
import { WingsProgress } from './WingsProgress'

export function Stage() {
  const engine = useMissionEngine()
  const {
    mission,
    missionIndex,
    totalMissions,
    displayMood,
    displayLine,
    showSparkles,
  } = engine

  return (
    <div className="stage relative min-h-screen overflow-x-hidden">
      <div className="stage-bg" aria-hidden />
      <div className="stage-overlay" aria-hidden />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[var(--surface)] px-3 py-1.5 shadow-[var(--shadow-soft)]">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink-900)]">
              Fairydev
            </p>
          </div>
          <p className="hidden text-sm text-[var(--ink-700)] sm:block">
            {mission.name}
          </p>
        </div>

        <WingsProgress current={missionIndex} total={totalMissions} />

        <WalletMultiButton />
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-6 px-4 pb-28 pt-2 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-8 lg:pb-10 lg:pt-4">
        <div className="relative flex flex-col items-center lg:items-start">
          <SpeechBubble
            text={displayLine}
            className="z-20 mb-3 w-full max-w-sm lg:ml-6"
          />
          <div className="relative w-full max-w-md lg:max-w-none">
            <Sparkles active={showSparkles} />
            <Fairy mood={displayMood} className="fairy-float mx-auto w-full" />
          </div>
        </div>

        <div className="w-full lg:pb-8">
          <ActionZone engine={engine} />
        </div>
      </main>

      {/* Mobile sticky Next is inside ActionZone; add bottom safe padding via pb-28 */}
    </div>
  )
}
