type Props = {
  active: boolean
}

const POSITIONS = [
  { top: '8%', left: '18%' },
  { top: '18%', left: '72%' },
  { top: '42%', left: '10%' },
  { top: '55%', left: '80%' },
  { top: '12%', left: '48%' },
]

export function Sparkles({ active }: Props) {
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {POSITIONS.map((pos, i) => (
        <img
          key={i}
          src="/sparkle.svg"
          alt=""
          className="absolute h-5 w-5"
          style={{
            ...pos,
            animation: `sparkle-burst 900ms ease-out ${i * 80}ms both`,
          }}
        />
      ))}
    </div>
  )
}
