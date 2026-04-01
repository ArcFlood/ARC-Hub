import { useSettingsStore } from '../../stores/settingsStore'

export default function RoutingIndicator() {
  const { routingMode, routingAggressiveness } = useSettingsStore((s) => s.settings)
  if (routingMode !== 'auto') return null
  const labels: Record<string, string> = {
    'cost-first': 'Cost-first',
    'balanced': 'Balanced',
    'quality-first': 'Quality-first',
  }
  return (
    <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
      Auto · {labels[routingAggressiveness]}
    </span>
  )
}
