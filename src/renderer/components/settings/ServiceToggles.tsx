interface Props {
  autoStartOllama: boolean
  autoStartFabric: boolean
  onOllamaChange: (v: boolean) => void
  onFabricChange: (v: boolean) => void
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-text">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface-elevated border border-border'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}

export default function ServiceToggles({ autoStartOllama, autoStartFabric, onOllamaChange, onFabricChange }: Props) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Auto-start on launch</h4>
      <div className="space-y-3">
        <Toggle checked={autoStartOllama} onChange={onOllamaChange} label="Start Ollama automatically" />
        <Toggle checked={autoStartFabric} onChange={onFabricChange} label="Start Fabric server automatically" />
      </div>
    </div>
  )
}
