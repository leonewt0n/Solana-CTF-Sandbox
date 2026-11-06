type Props = {
  label: string
  disabled?: boolean
  onConfirm: () => void
}

export function ManualConfirmAction({ label, disabled, onConfirm }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onConfirm}
      className="btn-primary"
    >
      {label}
    </button>
  )
}
