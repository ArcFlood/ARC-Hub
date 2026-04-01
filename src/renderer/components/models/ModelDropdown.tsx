import { RoutingMode } from '../../stores/types'
import { useSettingsStore } from '../../stores/settingsStore'

const MODES: { value: RoutingMode; label: string; desc: string }[] = [
  { value: 'auto', label: '⚡ Auto-route', desc: 'Intelligently pick the best model' },
  { value: 'ollama', label: '💻 Always Local', desc: 'Force Ollama for everything' },
  { value: 'haiku', label: '⚡ Always Haiku', desc: 'Force Claude Haiku' },
  { value: 'arc-sonnet', label: '🧠 Always A.R.C.', desc: 'Force Sonnet with A.R.C.' },
]

interface Props { onClose: () => void }

export default function ModelDropdown({ onClose }: Props) {
  const { routingMode, routingAggressiveness } = useSettingsStore((s) => s.settings)
  const setRoutingMode = useSettingsStore((s) => s.setRoutingMode)
  const setAggr = useSettingsStore((s) => s.setRoutingAggressiveness)

  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-xl shadow-lg z-50 p-2">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => { setRoutingMode(m.value); onClose() }}
          className={`w-full flex flex-col px-3 py-2 rounded-lg text-left transition-colors ${
            routingMode === m.value ? 'bg-accent/15 border border-accent/30' : 'hover:bg-surface-elevated'
          }`}
        >
          <span className="text-sm font-medium text-text">{m.label}</span>
          <span className="text-xs text-text-muted">{m.desc}</span>
        </button>
      ))}

      {routingMode === 'auto' && (
        <>
          <div className="border-t border-border my-2" />
          <p className="text-xs text-text-muted px-3 pb-1 font-semibold uppercase tracking-wider">Routing style</p>
          {(['cost-first', 'balanced', 'quality-first'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAggr(a)}
              className={`w-full px-3 py-1.5 rounded-lg text-left text-sm transition-colors ${
                routingAggressiveness === a ? 'text-accent font-medium' : 'text-text-muted hover:text-text hover:bg-surface-elevated'
              }`}
            >
              {a === 'cost-first' ? '💰 Cost-first' : a === 'balanced' ? '⚖️ Balanced' : '✨ Quality-first'}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
