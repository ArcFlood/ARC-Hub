export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0.00'
  if (amount < 0.001) return '<$0.001'
  if (amount < 0.01) return `$${amount.toFixed(4)}`
  return `$${amount.toFixed(2)}`
}

export function formatCostBadge(amount: number): string {
  if (amount === 0) return 'Free'
  if (amount < 0.001) return '<$0.001'
  return `$${amount.toFixed(3)}`
}
