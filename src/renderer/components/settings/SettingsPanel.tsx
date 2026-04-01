import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../../stores/settingsStore'
import { useServiceStore } from '../../stores/serviceStore'
import ApiKeyInput from './ApiKeyInput'
import BudgetSettings from './BudgetSettings'
import ServiceToggles from './ServiceToggles'
import ModelManager from '../models/ModelManager'
import AnalyticsPanel from '../cost/AnalyticsPanel'

type Tab = 'api' | 'budget' | 'routing' | 'models' | 'analytics' | 'about'

export default function SettingsPanel() {
  const { settings, updateSettings, closeSettingsPanel, resetToDefaults } = useSettingsStore()
  const availableModels = useServiceStore((s) => s.availableOllamaModels)
  // claudeApiKey is intentionally excluded — managed separately via ApiKeyInput (write-only IPC)
  const [local, setLocal] = useState({ ...settings })
  const [activeTab, setActiveTab] = useState<Tab>('api')

  const save = () => { updateSettings(local); closeSettingsPanel() }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'api', label: 'API Keys' },
    { id: 'budget', label: 'Budget' },
    { id: 'routing', label: 'Routing' },
    { id: 'models', label: 'Models' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'about', label: 'About' },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/50" onClick={closeSettingsPanel} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-[560px] max-h-[82vh] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">Settings</h2>
            <button onClick={closeSettingsPanel} className="text-text-muted hover:text-text text-xl leading-none">×</button>
          </div>

          {/* Tabs — scrollable on small heights */}
          <div className="flex border-b border-border px-4 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === t.id ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* API Keys */}
            {activeTab === 'api' && (
              <>
                <ApiKeyInput />

                <div className="bg-surface-elevated border border-border rounded-lg px-4 py-3 text-xs text-text-muted space-y-1">
                  <p>Claude (Haiku, Sonnet, Opus) tiers require an API key.</p>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); window.electron.openExternal('https://console.anthropic.com/settings/keys') }}
                    className="underline hover:opacity-80 text-accent"
                  >
                    Get your key at console.anthropic.com →
                  </a>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Ollama Model</label>
                  {availableModels.length > 0 ? (
                    <select value={local.ollamaModel}
                      onChange={(e) => setLocal((s) => ({ ...s, ollamaModel: e.target.value }))}
                      className="input-base w-full">
                      {availableModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={local.ollamaModel}
                      onChange={(e) => setLocal((s) => ({ ...s, ollamaModel: e.target.value }))}
                      placeholder="llama3.2:3b" className="input-base w-full" />
                  )}
                  <p className="text-xs text-text-muted">
                    {availableModels.length > 0
                      ? `${availableModels.length} model${availableModels.length !== 1 ? 's' : ''} detected`
                      : 'Start Ollama to auto-detect installed models'}
                  </p>
                </div>
              </>
            )}

            {/* Budget */}
            {activeTab === 'budget' && (
              <BudgetSettings daily={local.dailyBudgetLimit} monthly={local.monthlyBudgetLimit}
                onDailyChange={(v) => setLocal((s) => ({ ...s, dailyBudgetLimit: v }))}
                onMonthlyChange={(v) => setLocal((s) => ({ ...s, monthlyBudgetLimit: v }))} />
            )}

            {/* Routing */}
            {activeTab === 'routing' && (
              <>
                <ServiceToggles autoStartOllama={local.autoStartOllama} autoStartFabric={local.autoStartFabric}
                  onOllamaChange={(v) => setLocal((s) => ({ ...s, autoStartOllama: v }))}
                  onFabricChange={(v) => setLocal((s) => ({ ...s, autoStartFabric: v }))} />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Routing</h4>
                  <div className="space-y-1.5">
                    <label className="text-xs text-text-muted">Mode</label>
                    <select value={local.routingMode}
                      onChange={(e) => setLocal((s) => ({ ...s, routingMode: e.target.value as 'auto' | 'ollama' | 'haiku' | 'arc-sonnet' }))}
                      className="input-base w-full">
                      <option value="auto">Auto (smart routing)</option>
                      <option value="ollama">Always Local (Ollama)</option>
                      <option value="haiku">Always Haiku</option>
                      <option value="arc-sonnet">Always A.R.C. (Sonnet)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-text-muted">Aggressiveness</label>
                    <select value={local.routingAggressiveness}
                      onChange={(e) => setLocal((s) => ({ ...s, routingAggressiveness: e.target.value as 'cost-first' | 'balanced' | 'quality-first' }))}
                      className="input-base w-full">
                      <option value="cost-first">Cost-first (prefer local)</option>
                      <option value="balanced">Balanced (recommended)</option>
                      <option value="quality-first">Quality-first (prefer cloud)</option>
                    </select>
                  </div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider pt-2">Display</h4>
                  {[
                    { key: 'showRoutingReasons' as const, label: 'Show routing reasons in chat' },
                    { key: 'extendedThinking' as const, label: 'Extended thinking (A.R.C. tier)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text">{label}</span>
                      <button type="button" onClick={() => setLocal((s) => ({ ...s, [key]: !s[key] }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${local[key] ? 'bg-accent' : 'bg-surface-elevated border border-border'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${local[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Models */}
            {activeTab === 'models' && <ModelManager />}

            {/* Analytics */}
            {activeTab === 'analytics' && <AnalyticsPanel />}

            {/* About */}
            {activeTab === 'about' && (
              <div className="space-y-3 text-sm text-text-muted">
                <div>
                  <p className="text-text font-semibold">A.R.C. Hub</p>
                  <p className="text-xs mt-0.5">v0.4.0 — Privacy-first 3-tier AI routing</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-medium text-text-muted uppercase tracking-wider">Keyboard Shortcuts</p>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between"><span>New Chat</span><kbd className="bg-surface-elevated px-1.5 py-0.5 rounded text-text">⌘K</kbd></div>
                    <div className="flex justify-between"><span>Settings</span><kbd className="bg-surface-elevated px-1.5 py-0.5 rounded text-text">⌘,</kbd></div>
                    <div className="flex justify-between"><span>Close Settings</span><kbd className="bg-surface-elevated px-1.5 py-0.5 rounded text-text">Esc</kbd></div>
                    <div className="flex justify-between"><span>Send Message</span><kbd className="bg-surface-elevated px-1.5 py-0.5 rounded text-text">Enter</kbd></div>
                    <div className="flex justify-between"><span>New Line</span><kbd className="bg-surface-elevated px-1.5 py-0.5 rounded text-text">⇧Enter</kbd></div>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-text-muted uppercase tracking-wider">Tiers</p>
                  <div className="space-y-1">
                    <p>💻 <span className="text-success">Local (Ollama)</span> — free, private, instant</p>
                    <p>⚡ <span className="text-haiku-accent">Haiku</span> — $1/M in · $5/M out</p>
                    <p>🧠 <span className="text-arc-accent">A.R.C. (Sonnet)</span> — $3/M in · $15/M out</p>
                  </div>
                </div>
                <div className="pt-2">
                  <button onClick={resetToDefaults} className="btn-danger text-xs">Reset all settings</button>
                </div>
              </div>
            )}
          </div>

          {/* Footer — hide for analytics/models tabs (they have their own actions) */}
          {activeTab !== 'analytics' && activeTab !== 'models' && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <button onClick={closeSettingsPanel} className="btn-ghost">Cancel</button>
              <button onClick={save} className="btn-primary">Save Changes</button>
            </div>
          )}
          {(activeTab === 'analytics' || activeTab === 'models') && (
            <div className="flex justify-end px-6 py-4 border-t border-border">
              <button onClick={closeSettingsPanel} className="btn-ghost">Close</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
