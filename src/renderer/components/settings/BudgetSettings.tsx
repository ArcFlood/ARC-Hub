interface Props {
  daily: number
  monthly: number
  onDailyChange: (v: number) => void
  onMonthlyChange: (v: number) => void
}

export default function BudgetSettings({ daily, monthly, onDailyChange, onMonthlyChange }: Props) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Budget Limits</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-text-muted">Daily ($)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={daily}
            onChange={(e) => onDailyChange(parseFloat(e.target.value))}
            className="input-base w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-text-muted">Monthly ($)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={monthly}
            onChange={(e) => onMonthlyChange(parseFloat(e.target.value))}
            className="input-base w-full"
          />
        </div>
      </div>
    </div>
  )
}
