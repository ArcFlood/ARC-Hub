import { useState, useEffect, useCallback } from 'react'

interface SessionFile {
  date: string
  path: string
  filename: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function SessionHistoryPanel({ open, onClose }: Props) {
  const [sessions, setSessions] = useState<SessionFile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const loadSessions = useCallback(async () => {
    const result = await window.electron.sessionList?.(50)
    if (result?.success) setSessions(result.sessions)
  }, [])

  useEffect(() => {
    if (open) loadSessions()
  }, [open, loadSessions])

  const openSession = async (filePath: string) => {
    setSelected(filePath)
    setLoading(true)
    const result = await window.electron.sessionRead?.(filePath)
    setContent(result?.content ?? '')
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-[860px] max-w-[95vw] h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-text">Session History</h2>
            <p className="text-xs text-text-muted mt-0.5">{sessions.length} sessions recorded</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text text-lg leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Session list */}
          <div className="w-52 border-r border-border flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-4 text-xs text-text-muted italic text-center">No sessions yet</div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.path}
                    onClick={() => openSession(s.path)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors ${
                      selected === s.path
                        ? 'bg-accent/10 text-text'
                        : 'text-text-muted hover:bg-surface-elevated hover:text-text'
                    }`}
                  >
                    <p className="text-xs font-medium">{s.date}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 truncate">{s.filename.replace('_session.md', '').slice(11)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Session content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-text-muted animate-pulse">Loading…</span>
              </div>
            ) : content ? (
              <pre className="text-xs text-text whitespace-pre-wrap font-mono leading-relaxed">{content}</pre>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-text-muted italic">
                Select a session to view
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => window.electron.learningsOpenDir?.()}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Open History Folder
          </button>
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-1.5">Close</button>
        </div>
      </div>
    </div>
  )
}
