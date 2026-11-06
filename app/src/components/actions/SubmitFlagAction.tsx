import { useState, type FormEvent } from 'react'

type Props = {
  checking: boolean
  onSubmit: (value: string) => void
}

export function SubmitFlagAction({ checking, onSubmit }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!value.trim()) return
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="CTF{...}"
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-[var(--radius-md)] border border-pink-200 bg-white px-4 py-3 font-mono text-sm text-[var(--ink-900)] outline-none ring-[var(--gold-400)] focus:ring-2"
      />
      <button
        type="submit"
        className="btn-primary"
        disabled={checking || !value.trim()}
      >
        {checking ? 'Checking…' : 'Verify'}
      </button>
    </form>
  )
}
