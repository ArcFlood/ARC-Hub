export function formatCost(amount: number): string {
  if (amount === 0) return '$0.00'
  if (amount < 0.001) return '<$0.001'
  if (amount < 0.01) return `$${amount.toFixed(4)}`
  return `$${amount.toFixed(3)}`
}

export function formatCostShort(amount: number): string {
  if (amount === 0) return 'Free'
  if (amount < 0.001) return '<$0.01'
  return `$${amount.toFixed(2)}`
}

export function getBudgetStatus(
  spent: number,
  limit: number
): 'ok' | 'warning' | 'danger' {
  const ratio = spent / limit
  if (ratio >= 1.0) return 'danger'
  if (ratio >= 0.8) return 'warning'
  return 'ok'
}

export function getBudgetColor(status: 'ok' | 'warning' | 'danger'): string {
  switch (status) {
    case 'ok': return 'text-success'
    case 'warning': return 'text-warning'
    case 'danger': return 'text-error'
  }
}
