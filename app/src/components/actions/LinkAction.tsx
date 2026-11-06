type Props = {
  href: string
  label?: string
  hint?: string
}

export function LinkAction({
  href,
  label = 'Open link',
  hint,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="btn-primary inline-flex items-center justify-center text-center no-underline"
      >
        {label}
      </a>
      {hint && (
        <p className="text-sm text-[var(--ink-700)]">{hint}</p>
      )}
    </div>
  )
}
