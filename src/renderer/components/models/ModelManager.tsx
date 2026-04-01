import { useState, useRef } from 'react'
import { useServiceStore } from '../../stores/serviceStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface PullState {
  status: string
  total?: number
  completed?: number
  error?: string
  done: boolean
}

// Recommended models per PRD v2 — Qwen 3 family is the 2026 standard
const SUGGESTED_MODELS = [
  {
    name: 'qwen3:14b',
    desc: 'Primary — best quality/speed balance. HumanEval ~85%.',
    badge: 'RECOMMENDED',
    ram: '16GB',
  },
  {
    name: 'qwen3:7b',
    desc: 'Fast — 76.0% HumanEval, best sub-8B model. Low RAM.',
    badge: 'FAST',
    ram: '8GB',
  },
  {
    name: 'qwen2.5-coder:14b',
    desc: 'Coding — fine-tuned for code. Best local coding model.',
    badge: 'CODING',
    ram: '16GB',
  },
  {
    name: 'deepseek-r1:14b',
    desc: 'Reasoning — chain-of-thought visible. Math + logic.',
    badge: 'REASONING',
    ram: '16GB',
  },
  {
    name: 'qwen3:7b',
    desc: '7B — 76.0% HumanEval, best sub-8B for low-RAM systems.',
    badge: null,
    ram: '8GB',
  },
  {
    name: 'mistral:7b',
    desc: '7B — solid general purpose alternative.',
    badge: null,
    ram: '8GB',
  },
]

export default function ModelManager() {
  const ollamaRunning = useServiceStore((s) => s.getService('ollama')?.running ?? false)
  const availableModels = useServiceStore((s) => s.availableOllamaModels)
  const fetchOllamaModels = useServiceStore((s) => s.fetchOllamaModels)
  const autoFixOllamaModel = useSettingsStore((s) => s.autoFixOllamaModel)

  const [pullInput, setPullInput] = useState('')
  const [pulling, setPulling] = useState<string | null>(null)
  const [pullState, setPullState] = useState<PullState | null>(null)
  const [deletingModel, setDeletingModel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ── Pull a model ─────────────────────────────────────────────────
  const handlePull = async (modelName: string) => {
    if (!ollamaRunning || pulling) return
    const name = modelName.trim()
    if (!name) return

    setError(null)
    setPulling(name)
    setPullState({ status: 'Starting download...', done: false })
    setPullInput('')

    const streamId = crypto.randomUUID()
    abortRef.current = new AbortController()

    const cleanup = window.electron.onStreamEvent(streamId, (raw: unknown) => {
      const data = raw as { type: string; status?: string; total?: number; completed?: number; error?: string }

      if (data.type === 'progress') {
        setPullState({
          status: data.status ?? '',
          total: data.total,
          completed: data.completed,
          done: false,
        })
      } else if (data.type === 'done') {
        cleanup()
        setPullState({ status: 'Complete!', done: true })
        setPulling(null)
        // Refresh model list
        fetchOllamaModels().then((models) => {
          if (models.length > 0) autoFixOllamaModel(models)
        })
        setTimeout(() => setPullState(null), 2000)
      } else if (data.type === 'error') {
        cleanup()
        setError(data.error ?? 'Pull failed')
        setPulling(null)
        setPullState(null)
      }
    })

    abortRef.current.signal.addEventListener('abort', () => {
      cleanup()
      window.electron.streamAbort(streamId)
      setPulling(null)
      setPullState(null)
    })

    window.electron.ollamaPullModel({ streamId, modelName: name })
  }

  // ── Delete a model ────────────────────────────────────────────────
  const handleDelete = async (modelName: string) => {
    if (deletingModel) return
    setError(null)
    setDeletingModel(modelName)
    try {
      const result = await window.electron.ollamaDeleteModel(modelName)
      if (result.success) {
        await fetchOllamaModels()
      } else {
        setError(result.error ?? 'Delete failed')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setDeletingModel(null)
    }
  }

  const pullPercent =
    pullState?.total && pullState.completed
      ? Math.round((pullState.completed / pullState.total) * 100)
      : null

  if (!ollamaRunning) {
    return (
      <div className="text-xs text-text-muted bg-surface-elevated rounded-lg px-4 py-3 text-center">
        Start Ollama to manage local models
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Installed models */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Installed ({availableModels.length})
        </p>
        {availableModels.length === 0 ? (
          <p className="text-xs text-text-muted italic">No models installed</p>
        ) : (
          <div className="space-y-1">
            {availableModels.map((m) => (
              <div
                key={m}
                className="flex items-center justify-between px-3 py-2 bg-background rounded-lg border border-border group"
              >
                <span className="text-sm text-text font-mono">{m}</span>
                <button
                  onClick={() => handleDelete(m)}
                  disabled={deletingModel === m || pulling !== null}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-danger hover:text-danger/80 disabled:opacity-30"
                  title={`Delete ${m}`}
                >
                  {deletingModel === m ? '...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pull progress */}
      {pullState && (
        <div className="bg-surface-elevated rounded-lg px-3 py-2.5 space-y-1.5 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text truncate">{pulling}</span>
            <button
              onClick={() => abortRef.current?.abort()}
              className="text-xs text-text-muted hover:text-danger ml-2"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-text-muted">{pullState.status}</p>
          {pullPercent !== null && (
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${pullPercent}%` }}
              />
            </div>
          )}
          {pullState.done && (
            <p className="text-xs text-success font-medium">Downloaded successfully</p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Pull new model */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Pull New Model</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={pullInput}
            onChange={(e) => setPullInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePull(pullInput)}
            placeholder="e.g. llama3.2:3b"
            disabled={!!pulling}
            className="input-base flex-1 text-xs font-mono"
          />
          <button
            onClick={() => handlePull(pullInput)}
            disabled={!pullInput.trim() || !!pulling}
            className="btn-primary text-xs px-3 disabled:opacity-40"
          >
            Pull
          </button>
        </div>

        {/* Suggestions — Qwen 3 family per PRD v2 */}
        <div className="space-y-1">
          <p className="text-xs text-text-muted">Recommended (2026):</p>
          <div className="grid grid-cols-1 gap-1">
            {SUGGESTED_MODELS
              .filter((s) => !availableModels.includes(s.name))
              .filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i) // dedupe
              .slice(0, 5)
              .map((s) => (
              <button
                key={s.name}
                onClick={() => handlePull(s.name)}
                disabled={!!pulling}
                className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-background border border-border hover:border-accent/50 hover:bg-surface-elevated transition-colors text-left disabled:opacity-40"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-text font-mono">{s.name}</span>
                    {s.badge && (
                      <span className="text-[10px] px-1 py-0 rounded bg-accent/20 text-accent font-semibold">
                        {s.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">{s.ram} RAM</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{s.desc}</p>
                </div>
                <span className="text-[10px] text-accent shrink-0 mt-0.5">Pull</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
