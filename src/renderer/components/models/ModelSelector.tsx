import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import ModelDropdown from './ModelDropdown'
import RoutingIndicator from './RoutingIndicator'

const modeLabels: Record<string, string> = {
  auto: '⚡ Auto',
  ollama: '💻 Local',
  haiku: '⚡ Haiku',
  'arc-sonnet': '🧠 A.R.C.',
}

export default function ModelSelector() {
  const [open, setOpen] = useState(false)
  const routingMode = useSettingsStore((s) => s.settings.routingMode)

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated hover:bg-border rounded-lg text-sm font-medium text-text transition-colors border border-border"
      >
        <span>{modeLabels[routingMode]}</span>
        <span className="text-text-muted text-xs">▾</span>
      </button>
      <RoutingIndicator />
      {open && <ModelDropdown onClose={() => setOpen(false)} />}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
