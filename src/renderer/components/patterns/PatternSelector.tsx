import { useState, useEffect, useRef, useCallback } from 'react'
import { useConversationStore } from '../../stores/conversationStore'
import { useServiceStore } from '../../stores/serviceStore'
import {
  listFabricPatterns,
  runFabricPattern,
  patternLabel,
  patternDescription,
  patternEmoji,
} from '../../services/fabricService'

// ── Fallback patterns when Fabric is offline ──────────────────────
const FALLBACK_PATTERNS = [
  'extract_wisdom',
  'summarize',
  'explain_code',
  'improve_writing',
  'create_quiz',
  'analyze_claims',
  'create_summary',
]

type PanelState = 'list' | 'input'

export default function PatternSelector() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [patterns, setPatterns] = useState<string[]>([])
  const [loadingPatterns, setLoadingPatterns] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [panel, setPanel] = useState<PanelState>('list')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fabricRunning = useServiceStore((s) => s.getService('fabric')?.running ?? false)
  const activeConversation = useConversationStore((s) => s.activeConversation())
  const addMessage = useConversationStore((s) => s.addMessage)
  const updateMessage = useConversationStore((s) => s.updateMessage)

  // ── Load patterns when dropdown opens ──────────────────────────
  const fetchPatterns = useCallback(async () => {
    setLoadingPatterns(true)
    const result = await listFabricPatterns()
    if (result.length > 0) {
      setPatterns(result)
    } else {
      setPatterns(FALLBACK_PATTERNS)
    }
    setLoadingPatterns(false)
  }, [])

  useEffect(() => {
    if (open && patterns.length === 0) fetchPatterns()
  }, [open, patterns.length, fetchPatterns])

  // ── Filtered pattern list ──────────────────────────────────────
  const filtered = patterns.filter((p) => {
    const q = search.toLowerCase()
    return p.toLowerCase().includes(q) || patternDescription(p).toLowerCase().includes(q)
  })

  // ── Select pattern → show input panel ─────────────────────────
  const handleSelectPattern = (id: string) => {
    setSelectedPattern(id)
    setInputText('')
    setError(null)
    setPanel('input')
  }

  const handleBack = () => {
    setPanel('list')
    setSelectedPattern(null)
    setError(null)
    abortRef.current?.abort()
    setRunning(false)
  }

  const handleClose = () => {
    handleBack()
    setOpen(false)
    setSearch('')
  }

  // ── Apply pattern ──────────────────────────────────────────────
  const handleApply = () => {
    if (!selectedPattern || !inputText.trim() || running) return
    if (!activeConversation) {
      setError('Start a conversation first.')
      return
    }
    if (!fabricRunning) {
      setError('Fabric is not running. Start it from the sidebar.')
      return
    }

    setError(null)
    setRunning(true)
    const convId = activeConversation.id

    // Add user-visible "applied pattern" message
    addMessage(convId, {
      role: 'user',
      content: `**Fabric: ${patternLabel(selectedPattern)}**\n\n${inputText.trim()}`,
      model: null,
      cost: 0,
      timestamp: Date.now(),
    })

    // Placeholder assistant message
    const placeholder = addMessage(convId, {
      role: 'assistant',
      content: '',
      model: 'ollama', // visual tier — no API cost
      cost: 0,
      timestamp: Date.now(),
      isStreaming: true,
      routingReason: `Fabric: ${selectedPattern}`,
    })

    let accumulated = ''
    abortRef.current = new AbortController()

    runFabricPattern(
      selectedPattern,
      inputText.trim(),
      {
        onToken: (token) => {
          accumulated += token
          updateMessage(convId, placeholder.id, { content: accumulated, isStreaming: true })
        },
        onComplete: (full) => {
          updateMessage(convId, placeholder.id, {
            content: full || accumulated,
            isStreaming: false,
          })
          setRunning(false)
          handleClose()
        },
        onError: (err) => {
          updateMessage(convId, placeholder.id, {
            content: `⚠️ Fabric error: ${err.message}`,
            isStreaming: false,
          })
          setError(err.message)
          setRunning(false)
        },
      },
      abortRef.current.signal
    )
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setRunning(false)
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
          open
            ? 'bg-arc-accent/10 border-arc-accent/40 text-arc-accent'
            : 'bg-surface-elevated hover:bg-border border-border text-text-muted hover:text-text'
        }`}
      >
        <span className="text-arc-accent">◈</span>
        <span>Patterns</span>
        {fabricRunning && <span className="w-1.5 h-1.5 rounded-full bg-success" title="Fabric running" />}
        <span className="text-xs opacity-60">▾</span>
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={handleClose} />}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {panel === 'list' ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <span className="text-xs font-semibold text-arc-accent uppercase tracking-wide">
                  Fabric Patterns
                </span>
                {!fabricRunning && (
                  <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">
                    Fabric offline — preview only
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="px-2 pb-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patterns..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>

              {/* Pattern list */}
              <div className="max-h-64 overflow-y-auto p-1">
                {loadingPatterns ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-text-muted">
                    <span className="animate-spin">⟳</span>
                    Loading patterns...
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4 italic">
                    {search ? 'No patterns match your search' : 'No patterns found'}
                  </p>
                ) : (
                  filtered.map((id) => (
                    <button
                      key={id}
                      onClick={() => handleSelectPattern(id)}
                      className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-elevated transition-colors text-left"
                    >
                      <span className="text-base mt-0.5 select-none">{patternEmoji(id)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">{patternLabel(id)}</p>
                        <p className="text-xs text-text-muted line-clamp-1">{patternDescription(id)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {patterns.length > 0 ? `${filtered.length} of ${patterns.length} patterns` : 'Loading...'}
                </span>
                {!fabricRunning && (
                  <span className="text-xs text-text-muted italic">Start Fabric to run</span>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Input panel */}
              <div className="flex items-center gap-2 px-3 py-3 border-b border-border/50">
                <button
                  onClick={handleBack}
                  disabled={running}
                  className="text-text-muted hover:text-text transition-colors text-sm disabled:opacity-40"
                >
                  ←
                </button>
                <span className="text-sm font-medium text-text flex items-center gap-1.5">
                  <span>{patternEmoji(selectedPattern ?? '')}</span>
                  {patternLabel(selectedPattern ?? '')}
                </span>
              </div>

              <div className="p-3 space-y-2">
                <p className="text-xs text-text-muted">{patternDescription(selectedPattern ?? '')}</p>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste or type the text to process..."
                  disabled={running}
                  rows={5}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none disabled:opacity-50"
                  autoFocus
                />

                {error && (
                  <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-1.5">{error}</p>
                )}

                <div className="flex gap-2">
                  {running ? (
                    <button
                      onClick={handleStop}
                      className="flex-1 py-2 text-xs rounded-lg bg-surface-elevated hover:bg-border border border-border text-text-muted transition-colors"
                    >
                      ⏹ Stop
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleApply}
                        disabled={!inputText.trim() || !fabricRunning}
                        className="flex-1 py-2 text-xs rounded-lg bg-arc-accent hover:bg-arc-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
                      >
                        {fabricRunning ? 'Apply Pattern' : 'Fabric Offline'}
                      </button>
                      <button
                        onClick={handleBack}
                        className="px-3 py-2 text-xs rounded-lg bg-surface-elevated hover:bg-border border border-border text-text-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {running && (
                  <p className="text-xs text-text-muted text-center animate-pulse">
                    Running {patternLabel(selectedPattern ?? '')}...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
