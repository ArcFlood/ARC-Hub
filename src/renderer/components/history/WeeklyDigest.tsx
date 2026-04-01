import { useState, useEffect } from 'react'
import { useCostStore } from '../../stores/costStore'
import { useConversationStore } from '../../stores/conversationStore'

interface Props {
  onDismiss: () => void
}

function fmt(n: number): string {
  if (n === 0) return '$0.00'
  if (n < 0.001) return `$${(n * 1000).toFixed(3)}m`
  return `$${n.toFixed(4)}`
}

export default function WeeklyDigest({ onDismiss }: Props) {
  const getSummary = useCostStore((s) => s.getSummary)
  const records = useCostStore((s) => s.records)
  const conversations = useConversationStore((s) => s.conversations)
  const [sessionCount, setSessionCount] = useState(0)

  const summary = getSummary()
  const totalMessages = conversations.reduce(
    (s, c) => s + c.messages.filter((m) => m.role !== 'system').length,
    0
  )

  useEffect(() => {
    window.electron.sessionList?.(7).then((r) => {
      if (r?.success) setSessionCount(r.sessions.length)
    })
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center z-40 pointer-events-none px-4">
      <div className="pointer-events-auto bg-surface border border-border rounded-2xl shadow-2xl p-5 w-full max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-text">Weekly Digest</p>
            <p className="text-xs text-text-muted mt-0.5">Your A.R.C. activity this week</p>
          </div>
          <button onClick={onDismiss} className="text-text-muted hover:text-text text-lg leading-none ml-4">×</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Spent (7d)', value: fmt(summary.week) },
            { label: 'Sessions', value: sessionCount },
            { label: 'Conversations', value: conversations.length },
            { label: 'Messages', value: totalMessages },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background rounded-lg border border-border px-3 py-2 text-center">
              <p className="text-[11px] text-text-muted">{label}</p>
              <p className="text-sm font-semibold text-text mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {records.length === 0 && (
          <p className="text-xs text-text-muted italic text-center mb-3">No API spending this week — all local!</p>
        )}

        <button onClick={onDismiss} className="btn-primary w-full text-xs py-2">Got it</button>
      </div>
    </div>
  )
}
