interface Props {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'start' | 'stop' | 'restart'
}

const styles = {
  start: 'border-success/40 text-success hover:bg-success/10',
  stop: 'border-danger/40 text-danger hover:bg-danger/10',
  restart: 'border-warning/40 text-warning hover:bg-warning/10',
}

export default function ServiceButton({ label, onClick, disabled, variant = 'start' }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-0.5 rounded border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {label}
    </button>
  )
}
