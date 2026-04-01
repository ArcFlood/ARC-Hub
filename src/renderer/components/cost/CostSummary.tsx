import { useCostStore } from '../../stores/costStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency } from '../../utils/formatCurrency'

export default function CostSummary() {
  const summary = useCostStore((s) => s.getSummary())
  const { dailyBudgetLimit, monthlyBudgetLimit } = useSettingsStore((s) => s.settings)

  const rows = [
    { label: 'Today', amount: summary.today, limit: dailyBudgetLimit },
    { label: 'This week', amount: summary.week, limit: null },
    { label: 'This month', amount: summary.month, limit: monthlyBudgetLimit },
  ]

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold text-text">Spending</h3>
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{row.label}</span>
            <span className={`text-sm font-medium ${row.amount > 0 ? 'text-danger' : 'text-text-muted'}`}>
              {formatCurrency(row.amount)}
            </span>
          </div>
          {row.limit && (
            <div className="w-full bg-surface-elevated rounded-full h-1">
              <div
                className="bg-danger h-1 rounded-full transition-all"
                style={{ width: `${Math.min((row.amount / row.limit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
