import { useEffect, useState } from 'react'

type Props = {
  text: string
  className?: string
}

export function SpeechBubble({ text, className = '' }: Props) {
  const [shown, setShown] = useState('')
  const [skip, setSkip] = useState(false)
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    setSkip(false)
    setShown('')
    if (reduceMotion) {
      setShown(text)
      return
    }
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, 22)
    return () => window.clearInterval(id)
  }, [text, reduceMotion])

  useEffect(() => {
    if (skip) setShown(text)
  }, [skip, text])

  return (
    <button
      type="button"
      onClick={() => setSkip(true)}
      className={`speech-bubble relative max-w-md rounded-[var(--radius-lg)] bg-[var(--surface)] px-5 py-4 text-left text-[var(--ink-900)] shadow-[var(--shadow-soft)] ${className}`}
      aria-label="Fairy speech"
    >
      <p className="font-[family-name:var(--font-body)] text-base leading-snug sm:text-lg">
        {shown}
        {shown.length < text.length && (
          <span className="ml-0.5 inline-block animate-pulse">▍</span>
        )}
      </p>
      <span
        className="absolute -bottom-2 left-10 h-4 w-4 rotate-45 bg-[var(--surface)]"
        aria-hidden
      />
    </button>
  )
}
