import { useCostStore } from '../../stores/costStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useSettingsStore } from '../../stores/settingsStore'

const TIER_CONFIG = {
  ollama: { label: 'Local (Ollama)', color: 'bg-success', textColor: 'text-success' },
  haiku: { label: 'Claude Haiku', color: 'bg-haiku-accent', textColor: 'text-haiku-accent' },
  'arc-sonnet': { label: 'A.R.C. Sonnet', color: 'bg-arc-accent', textColor: 'text-arc-accent' },
  'arc-opus': { label: 'A.R.C. Opus', color: 'bg-pink-500', textColor: 'text-pink-400' },
}

function fmt(n: number): string {
  if (n === 0) return '$0.00'
  if (n < 0.001) return `$${(n * 1000).toFixed(3)}m`
  return `$${n.toFixed(4)}`
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })
}

export default function AnalyticsPanel() {
  const getSummary = useCostStore((s) => s.getSummary)
  const getRecordsByDay = useCostStore((s) => s.getRecordsByDay)
  const getRecordsByTier = useCostStore((s) => s.getRecordsByTier)
  const clearRecords = useCostStore((s) => s.clearRecords)
  const records = useCostStore((s) => s.records)
  const conversations = useConversationStore((s) => s.conversations)
  const budgetWarnLimit = useSettingsStore((s) => s.settings.budgetWarnLimit)
  const monthlyBudgetLimit = useSettingsStore((s) => s.settings.monthlyBudgetLimit)

  const summary = getSummary()
  const daily = getRecordsByDay(7)
  const byTier = getRecordsByTier()

  const maxDay = Math.max(...daily.map((d) => d.amount), 0.0001)
  const totalSpend = summary.month
  const maxTier = Math.max(...Object.values(byTier), 0.0001)

  const totalMessages = conversations.reduce((s, c) => s + c.messages.filter(m => m.role !== 'system').length, 0)
  const paidMessages = records.length
  const freeMessages = totalMessages - paidMessages

  const atWarnThreshold = totalSpend >= budgetWarnLimit
  const atHardLimit = totalSpend >= monthlyBudgetLimit

  const handleExportCsv = async () => {
    const rows = records.map((r) => ({
      id: r.id,
      date: r.date,
      model: r.model,
      amount: r.amount,
      conversationId: r.conversationId,
    }))
    await window.electron.spendingExportCsv?.({ records: rows })
  }

  return (
    <div className="space-y-6">
      {/* Budget warning */}
      {(atWarnThreshold || atHardLimit) && (
        <div className={`rounded-lg px-3 py-2.5 text-xs border ${
          atHardLimit
            ? 'bg-danger/10 border-danger/40 text-danger'
            : 'bg-warning/10 border-warning/40 text-warning'
        }`}>
          {atHardLimit
            ? `Monthly limit reached ($${monthlyBudgetLimit}). Consider switching to local models.`
            : `Approaching monthly budget ($${totalSpend.toFixed(2)} / $${monthlyBudgetLimit}).`
          }
        </div>
      )}
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', value: fmt(summary.today) },
          { label: '7 days', value: fmt(summary.week) },
          { label: '30 days', value: fmt(summary.month) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-background rounded-lg border border-border px-3 py-2.5 text-center">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="text-sm font-semibold text-danger mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Daily spend bar chart (7 days) */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Daily Spend (7 days)</p>
        {daily.every((d) => d.amount === 0) ? (
          <p className="text-xs text-text-muted italic">No spending recorded yet</p>
        ) : (
          <div className="space-y-1.5">
            {daily.map(({ date, amount }) => (
              <div key={date} className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-20 flex-shrink-0">{shortDate(date)}</span>
                <div className="flex-1 h-4 bg-surface-elevated rounded overflow-hidden">
                  <div
                    className="h-full bg-danger/70 rounded transition-all duration-500"
                    style={{ width: `${(amount / maxDay) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted w-14 text-right flex-shrink-0">{fmt(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spend by tier */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">By Model Tier</p>
        <div className="space-y-2">
          {(Object.entries(byTier) as [keyof typeof TIER_CONFIG, number][]).map(([tier, amount]) => {
            const cfg = TIER_CONFIG[tier]
            const pct = totalSpend > 0 ? (amount / maxTier) * 100 : 0
            return (
              <div key={tier} className="flex items-center gap-2">
                <span className={`text-xs w-28 flex-shrink-0 ${cfg.textColor}`}>{cfg.label}</span>
                <div className="flex-1 h-3 bg-surface-elevated rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-500 ${cfg.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted w-14 text-right flex-shrink-0">{fmt(amount)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Message stats */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Message Stats</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Conversations', value: conversations.length },
            { label: 'Free (Local)', value: freeMessages },
            { label: 'Paid (Claude)', value: paidMessages },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background rounded-lg border border-border px-3 py-2.5 text-center">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-sm font-semibold text-text mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export + Clear */}
      {records.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="btn-secondary text-xs flex-1"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              if (window.confirm('Clear all spending records? This cannot be undone.')) clearRecords()
            }}
            className="btn-danger text-xs flex-1"
          >
            Clear Records
          </button>
        </div>
      )}
    </div>
  )
}
