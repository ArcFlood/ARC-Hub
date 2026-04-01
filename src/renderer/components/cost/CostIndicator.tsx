import { useCostStore } from '../../stores/costStore'
import { formatCurrency } from '../../utils/formatCurrency'

export default function CostIndicator() {
  const summary = useCostStore((s) => s.getSummary())
  const amount = summary.today

  return (
    <div className="flex items-center gap-1.5 text-xs text-text-muted">
      <span>Today:</span>
      <span className={amount > 0 ? 'text-danger font-medium' : ''}>
        {amount === 0 ? '$0.00' : formatCurrency(amount)}
      </span>
    </div>
  )
}
