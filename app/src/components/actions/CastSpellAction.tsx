type Props = {
  loading: boolean
  disabled: boolean
  onCast: () => void
}

export function CastSpellAction({ loading, disabled, onCast }: Props) {
  return (
    <button
      type="button"
      className="btn-primary"
      disabled={disabled || loading}
      onClick={onCast}
    >
      {loading ? 'Casting…' : 'Cast spell'}
    </button>
  )
}
