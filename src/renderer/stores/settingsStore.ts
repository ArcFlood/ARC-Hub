import { create } from 'zustand'
import { AppSettings, RoutingMode, RoutingAggressiveness } from './types'

const DEFAULT_SETTINGS: AppSettings = {
  claudeApiKey: '',
  ollamaModel: 'qwen3:14b',          // PRD v2: Qwen 3 14B replaces llama3.1 as primary
  dailyBudgetLimit: 3.0,             // PRD v2: $15-20/month target → ~$3/day
  monthlyBudgetLimit: 15.0,          // PRD v2: updated from $5 to $15
  budgetWarnLimit: 10.0,             // PRD v2: warn at $10/month
  autoStartOllama: false,
  autoStartFabric: false,
  routingMode: 'auto',
  routingAggressiveness: 'balanced',
  extendedThinking: false,
  showRoutingReasons: true,
}

interface SettingsStore {
  settings: AppSettings
  settingsPanelOpen: boolean
  updateSettings: (updates: Partial<AppSettings>) => void
  setApiKey: (key: string) => void
  setOllamaModel: (model: string) => void
  setRoutingMode: (mode: RoutingMode) => void
  setRoutingAggressiveness: (a: RoutingAggressiveness) => void
  toggleExtendedThinking: () => void
  openSettingsPanel: () => void
  closeSettingsPanel: () => void
  resetToDefaults: () => void
  autoFixOllamaModel: (availableModels: string[]) => void
  loadFromDb: () => Promise<void>
}

const DB_KEY = 'app-settings'

function persistSettings(settings: AppSettings): void {
  window.electron.db.settings
    .set(DB_KEY, JSON.stringify(settings))
    .catch(console.error)
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  settingsPanelOpen: false,

  loadFromDb: async () => {
    try {
      const result = await window.electron.db.settings.get(DB_KEY)
      if (result.success && result.value) {
        const saved = JSON.parse(result.value) as Partial<AppSettings>
        // Merge with defaults so new keys added later have values
        set({ settings: { ...DEFAULT_SETTINGS, ...saved } })
      }
    } catch (e) {
      console.error('[SettingsStore] DB load failed:', e)
    }
  },

  updateSettings: (updates) => {
    set((s) => {
      const settings = { ...s.settings, ...updates }
      persistSettings(settings)
      return { settings }
    })
  },

  setApiKey: (claudeApiKey) => {
    set((s) => {
      const settings = { ...s.settings, claudeApiKey }
      persistSettings(settings)
      return { settings }
    })
  },

  setOllamaModel: (ollamaModel) => {
    set((s) => {
      const settings = { ...s.settings, ollamaModel }
      persistSettings(settings)
      return { settings }
    })
  },

  setRoutingMode: (routingMode) => {
    set((s) => {
      const settings = { ...s.settings, routingMode }
      persistSettings(settings)
      return { settings }
    })
  },

  setRoutingAggressiveness: (routingAggressiveness) => {
    set((s) => {
      const settings = { ...s.settings, routingAggressiveness }
      persistSettings(settings)
      return { settings }
    })
  },

  toggleExtendedThinking: () => {
    set((s) => {
      const settings = { ...s.settings, extendedThinking: !s.settings.extendedThinking }
      persistSettings(settings)
      return { settings }
    })
  },

  openSettingsPanel: () => set({ settingsPanelOpen: true }),
  closeSettingsPanel: () => set({ settingsPanelOpen: false }),

  resetToDefaults: () => {
    set({ settings: { ...DEFAULT_SETTINGS } })
    persistSettings({ ...DEFAULT_SETTINGS })
  },

  autoFixOllamaModel: (availableModels) => {
    if (availableModels.length === 0) return
    const { ollamaModel } = get().settings
    if (!availableModels.includes(ollamaModel)) {
      const picked = availableModels[0]
      console.log(`[Settings] Model "${ollamaModel}" not found — auto-selecting "${picked}"`)
      set((s) => {
        const settings = { ...s.settings, ollamaModel: picked }
        persistSettings(settings)
        return { settings }
      })
    }
  },
}))
