import { formatCostBadge } from '../../utils/formatCurrency'

interface Props { amount: number; warn?: boolean }

export default function CostBadge({ amount, warn }: Props) {
  if (amount === 0) return null
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${warn ? 'text-danger bg-danger/10' : 'text-warning bg-warning/10'}`}>
      {formatCostBadge(amount)}
    </span>
  )
}
