import ModelSelector from './models/ModelSelector'
import CostIndicator from './cost/CostIndicator'
import PatternSelector from './patterns/PatternSelector'
import PluginPicker from './plugins/PluginPicker'

export default function TopBar() {
  return (
    <header className="titlebar-drag flex items-center justify-between px-4 h-12 min-h-12 border-b border-border bg-surface">
      <div className="titlebar-no-drag flex items-center gap-3">
        <ModelSelector />
      </div>
      <div className="titlebar-no-drag flex items-center gap-3">
        <PluginPicker />
        <PatternSelector />
        <CostIndicator />
      </div>
    </header>
  )
}
