import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

/**
 * Write-only API key input.
 * The raw key is sent directly to the main process for DB storage via IPC.
 * It is NEVER stored in renderer state or Zustand — only existence (hasApiKey: boolean) is known.
 */
export default function ApiKeyInput() {
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)

  const [draft, setDraft] = useState('')
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const handleSave = async () => {
    if (!draft.trim()) return
    setStatus('saving')
    const ok = await setApiKey(draft.trim())
    setStatus(ok ? 'saved' : 'error')
    if (ok) setDraft('')
    setTimeout(() => setStatus('idle'), 2500)
  }

  const handleClear = async () => {
    setStatus('saving')
    const ok = await setApiKey('')
    setStatus(ok ? 'saved' : 'error')
    setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Claude API Key</label>

      {/* Current status indicator */}
      <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
        hasApiKey
          ? 'bg-success/10 border-success/30 text-success'
          : 'bg-warning/10 border-warning/30 text-warning'
      }`}>
        <span>{hasApiKey ? '✓ API key configured' : '⚠ No API key set'}</span>
        {hasApiKey && (
          <button onClick={handleClear} className="ml-auto text-text-muted hover:text-danger text-xs transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Write-only input for setting a new key */}
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          placeholder={hasApiKey ? 'Enter new key to replace…' : 'sk-ant-api03-…'}
          className="input-base w-full pr-20"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-text-muted hover:text-text text-xs"
          >
            {visible ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!draft.trim() || status === 'saving'}
        className="btn-primary text-xs w-full disabled:opacity-40"
      >
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved!' : status === 'error' ? 'Error — try again' : 'Save Key'}
      </button>

      <p className="text-[11px] text-text-muted">
        Key is stored securely in the app — never sent to any server other than Anthropic.
      </p>
    </div>
  )
}
