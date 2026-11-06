import type { Mood } from '../content/missions'

const SRC: Record<Mood, string> = {
  idle: '/fairy/fairy-idle.webp',
  happy: '/fairy/fairy-happy.webp',
  thinking: '/fairy/fairy-thinking.webp',
  confused: '/fairy/fairy-confused.webp',
  celebrate: '/fairy/fairy-celebrate.webp',
}

type Props = {
  mood: Mood
  className?: string
}

export function Fairy({ mood, className = '' }: Props) {
  return (
    <div
      className={`fairy-sprite relative flex items-end justify-center ${className}`}
      aria-hidden
    >
      {(Object.keys(SRC) as Mood[]).map((key) => (
        <img
          key={key}
          src={SRC[key]}
          alt=""
          draggable={false}
          className="fairy-img absolute bottom-0 left-1/2 max-h-[min(58vh,520px)] w-auto max-w-full -translate-x-1/2 object-contain object-bottom transition-opacity duration-200"
          style={{ opacity: key === mood ? 1 : 0 }}
        />
      ))}
      {/* Layout spacer uses active mood dimensions via invisible happy (tallest) */}
      <img
        src={SRC.happy}
        alt=""
        aria-hidden
        className="invisible max-h-[min(58vh,520px)] w-auto max-w-full object-contain"
        draggable={false}
      />
    </div>
  )
}
