type Props = {
  current: number
  total: number
}

export function WingsProgress({ current, total }: Props) {
  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Mission ${Math.min(current + 1, total)} of ${total}`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => {
          const filled = i < current || (i === current && current < total)
          const active = i === current
          return (
            <img
              key={i}
              src="/wing.svg"
              alt=""
              className="h-5 w-7 transition-opacity"
              style={{
                opacity: filled ? 1 : 0.28,
                filter: active
                  ? 'drop-shadow(0 0 4px rgba(232,184,74,0.9))'
                  : undefined,
              }}
            />
          )
        })}
      </div>
      <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--ink-900)]">
        {Math.min(current + 1, total)}/{total}
      </span>
    </div>
  )
}
