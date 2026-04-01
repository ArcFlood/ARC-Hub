import { create } from 'zustand'
import { Plugin } from './types'

interface PluginState {
  plugins: Plugin[]
  activePlugin: Plugin | null
  loading: boolean

  loadPlugins: () => Promise<void>
  activatePlugin: (id: string) => void
  deactivatePlugin: () => void
  installFromFile: () => Promise<{ success: boolean; error?: string }>
  openPluginsDir: () => void

  // Helper: find a plugin by slash command (e.g. "/review")
  findByCommand: (command: string) => Plugin | null
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  activePlugin: null,
  loading: false,

  loadPlugins: async () => {
    set({ loading: true })
    try {
      const res = await window.electron.pluginsList()
      if (res.success) {
        // Cast PluginManifest[] (from IPC) to Plugin[] — shapes are identical
        set({ plugins: res.plugins as unknown as Plugin[] })
      }
    } catch (e) {
      console.error('[PluginStore] Failed to load plugins:', e)
    } finally {
      set({ loading: false })
    }
  },

  activatePlugin: (id: string) => {
    const plugin = get().plugins.find((p) => p.id === id) ?? null
    set({ activePlugin: plugin })
  },

  deactivatePlugin: () => {
    set({ activePlugin: null })
  },

  installFromFile: async () => {
    const res = await window.electron.pluginsInstallFile()
    if (res.success) {
      // Reload the list to pick up the newly installed plugin
      await get().loadPlugins()
    }
    return res
  },

  openPluginsDir: () => {
    window.electron.pluginsOpenDir()
  },

  findByCommand: (command: string) => {
    const lower = command.toLowerCase()
    return get().plugins.find((p) =>
      p.commands.some((cmd) => cmd.toLowerCase() === lower)
    ) ?? null
  },
}))
