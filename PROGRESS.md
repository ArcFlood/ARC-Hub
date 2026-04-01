# A.R.C. Hub — Build Progress
(hi there)
**Last updated:** 2026-04-01
**App version:** 1.0.0 — COMPLETE

> This file tracks implementation progress against the original WBS (`ai_hub_wbs.json`).
> Updated after each completed implementation step.

---

## Summary

| Phase | WBS Name | Our Build | Status |
|-------|----------|-----------|--------|
| P0 | Project Setup & Foundation | Electron + React + Vite scaffold | ✅ Complete |
| P1 | Core UI Components | All UI components | ✅ Complete |
| P2 | Local Storage & Data Management | SQLite via better-sqlite3 | ✅ Complete |
| P3 | Ollama Integration | IPC streaming, model auto-detect | ✅ Complete |
| P4 | Claude API Integration | IPC streaming + prompt caching | ✅ Complete |
| P5 | Fabric Integration | Real REST API + streaming patterns | ✅ Complete |
| P6 | Polish / Phase 4 | Keyboard shortcuts, export, packaging | ✅ Complete |
| P7 | Advanced Features | Analytics, model manager, onboarding | ✅ Complete |
| P8 | Plugin System | JSON manifests, slash commands, PluginPicker | ✅ Complete |
| P9 | Phase 9 / WBS Remainder | Conv tags, app menu, tray, docs, 0 TS errors | ✅ Complete |

> Note: Our implementation combined WBS phases and re-ordered them for faster delivery.
> WBS P2 (SQLite) was deprioritized — data currently lives in Zustand (in-memory per session).

---

## Detailed Status

### P0 — Project Setup & Foundation ✅

| Task | WBS ID | Status | Notes |
|------|--------|--------|-------|
| Electron + React + TypeScript + Vite | P0.1 | ✅ Done | Electron 28, React 18, Vite 5 |
| Tailwind CSS with dark mode | P0.2 | ✅ Done | Custom A.R.C. color palette |
| Zustand state management | P0.3 | ✅ Done | 4 stores: conversation, settings, service, cost |
| Basic app layout structure | P0.4 | ✅ Done | Sidebar + TopBar + ChatArea |

### P1 — Core UI Components ✅

| Task | WBS ID | Status | Notes |
|------|--------|--------|-------|
| Message bubble components | P1.1 | ✅ Done | UserMessage, AssistantMessage, SystemMessage |
| Message input component | P1.2 | ✅ Done | Auto-resize, Enter to send, stop button |
| Service status cards | P1.3 | ✅ Done | Ollama + Fabric with start/stop |
| Conversation list | P1.4 | ✅ Done | Search, select, delete, new chat |
| Cost display components | P1.5 | ✅ Done | CostBadge, CostSummary, CostIndicator |
| Settings panel | P1.6 | ✅ Done | API key, budget, routing prefs, model dropdown |
| Model selector | P1.7 | ✅ Done | 3-tier: Ollama / Haiku / A.R.C. Sonnet |
| Fabric pattern selector | P1.8 | ✅ Done | Real API integration (see P5 below) |

### P2 — Local Storage & Data Management ⚠️ Partial

| Task | WBS ID | Status | Notes |
|------|--------|--------|-------|
| SQLite database schema | P2.1 | ✅ Done | 4 tables: conversations, messages, spending_log, settings |
| IPC bridge for DB operations | P2.2 | ✅ Done | 10 IPC handlers; db namespace in preload |
| Conversation persistence | P2.3 | 🔲 Deferred | Conversations reset on app restart |
| Settings persistence | P2.4 | ⚠️ Partial | Settings persist via localStorage (via Zustand persist middleware — not yet added) |
| Cost tracking persistence | P2.5 | 🔲 Deferred | Cost resets on restart |

**Decision:** SQLite integration adds significant complexity (native modules, better-sqlite3 rebuild for Electron). Deferred to keep momentum. Settings persistence and conversation history are the most impactful items to add next.

### P3 — Ollama Integration ✅ (mapped to our Phase 2)

| Task | WBS ID | Status | Notes |
|------|--------|--------|-------|
| Ollama API client | P3.1 | ✅ Done | IPC-based streaming in main.ts |
| Model listing | P3.2 | ✅ Done | `ollama-list-models` IPC handler |
| Streaming chat | P3.3 | ✅ Done | Newline-delimited JSON, AbortController |
| Model auto-detection | P3.4 | ✅ Done | `autoFixOllamaModel()` in settingsStore |
| Service health check | P3.5 | ✅ Done | `service-status` IPC with pgrep |

**Bug fixed:** Default model was `qwen3:14b` (not installed). Auto-selects first available model from Ollama on startup.

### P4 — Claude API Integration ✅ (mapped to our Phase 2)

| Task | WBS ID | Status | Notes |
|------|--------|--------|-------|
| Claude streaming client | P4.1 | ✅ Done | IPC-based, runs in main process (no CORS) |
| Haiku middle tier | P4.2 | ✅ Done | `claude-haiku-4-5-20251001` |
| A.R.C. Sonnet tier | P4.3 | ✅ Done | `claude-sonnet-4-6` |
| Prompt caching | P4.4 | ✅ Done | `cache_control: ephemeral` on system prompt — ~90% cost reduction |
| A.R.C. prompt loading | P4.5 | ✅ Done | Loads from `~/.claude/Skills/CORE/SKILL.md`, 5-min cache, fallback |
| Smart 3-tier routing | P4.6 | ✅ Done | `routeQuery()` — complexity + budget aware |
| Usage tracking | P4.7 | ✅ Done | Input/output/cache tokens logged per message |

**Bug fixed:** Renderer CORS block on `api.anthropic.com`. Moved all fetch calls to main process, stream tokens back via IPC.

### P5 — Fabric Integration ✅ (our Phase 3 — just completed)

| Task | WBS ID | Status | Notes |
|------|--------|--------|-------|
| Pattern list from REST API | P5.1 | ✅ Done | `GET /api/patterns` with fallback to 7 hardcoded |
| Pattern execution via REST API | P5.2 | ✅ Done | `POST /api/pattern/{id}` — IPC-based, streaming |
| PatternSelector UI overhaul | P5.3 | ✅ Done | 2-panel: list → input → stream to chat |
| Fabric service health check | P5.4 | ✅ Done | Live badge in trigger button |
| fabricService.ts helper module | P5.5 | ✅ Done | `listFabricPatterns()`, `runFabricPattern()`, label/emoji/description helpers |
| Streaming response to chat | P5.6 | ✅ Done | Tokens streamed into assistant message in real-time |
| Offline/fallback behavior | P5.7 | ✅ Done | Shows 7 preview patterns when Fabric offline; Apply button disabled with message |

---

### P6 — Polish & Quality (our Phase 4) ✅ Complete

| Task | Status | Notes |
|------|--------|-------|
| Cmd+K → new chat | ✅ Done | `keydown` listener in Layout.tsx — works globally |
| Cmd+, → toggle settings | ✅ Done | Same listener; Escape also closes settings panel |
| Conversation export to Markdown | ✅ Done | `↓` button on hover in ConversationItem; native Save dialog via main process |
| Service status animations | ✅ Done | Pulsing ring on running services (CSS `animate-ping`); warning state during restart |
| Service card polish | ✅ Done | Border color transitions green when running; real log lines in logs panel |
| Package as .app (Mac) | ✅ Done | `npm run build:mac` — universal arm64+x64 DMG; entitlements.mac.plist added |
| Zustand persist middleware | ✅ Done | Settings persist to `localStorage` via `zustand/middleware`; conversations persist too |
| Streaming interrupt recovery | ✅ Done | `onRehydrateStorage` cleans up `isStreaming: true` messages left from app crash/close |
| App version bumped to 0.4.0 | ✅ Done | package.json |

### P7 — Advanced Features ✅ Complete

| Task | Status | Notes |
|------|--------|-------|
| costStore persist | ✅ Done | Spending records survive restarts; 90-day auto-prune on load |
| Analytics helpers | ✅ Done | `getRecordsByDay(n)` + `getRecordsByTier()` added to costStore |
| Ollama model manager | ✅ Done | Pull with progress bar, delete, suggestions list; Settings → Models tab |
| `ollama-pull-model` IPC | ✅ Done | Streams progress events (status, completed/total) via `stream-${id}` |
| `ollama-delete-model` IPC | ✅ Done | DELETE /api/delete to Ollama; refreshes model list after |
| Usage analytics panel | ✅ Done | 7-day daily spend bar chart, per-tier breakdown, message count stats |
| Analytics tab in Settings | ✅ Done | Settings → Analytics shows all charts + clear records button |
| First-run onboarding | ✅ Done | EmptyState shows 3-step checklist when no API key + Ollama offline |
| Onboarding auto-completes | ✅ Done | Steps tick off as Ollama starts and API key is entered |
| Routing mode/aggressiveness dropdowns | ✅ Done | Replaced hard-coded radio with proper selects in Settings → Routing tab |
| Keyboard shortcuts in About tab | ✅ Done | Full shortcut reference card |
| Model comparison mode | 🔲 Skipped | Side-by-side responses — out of scope |
| SQLite persistence | ✅ Done | `~/.noah-ai-hub/conversations.db`; all 3 stores migrated off localStorage |
| Plugin system | ✅ Done | See P8 below |

### P8 — Plugin System ✅ Complete

| Task | Status | Notes |
|------|--------|-------|
| Plugin manifest format (JSON) | ✅ Done | `id, name, description, version, icon, tier, commands[], systemPrompt` |
| Plugin loader (`src/main/plugins/loader.ts`) | ✅ Done | Scans `~/.noah-ai-hub/plugins/`, validates shape, sorts by name |
| Seed 5 sample plugins on first run | ✅ Done | Code Reviewer, Writing Coach, SQL Assistant, Brainstorm, Debugger |
| `plugins:list` IPC handler | ✅ Done | Returns validated manifests from disk |
| `plugins:install-file` IPC handler | ✅ Done | Native open-file dialog for `.json` install |
| `plugins:open-dir` IPC handler | ✅ Done | `shell.openPath()` to plugins folder |
| `pluginStore.ts` Zustand store | ✅ Done | `plugins[], activePlugin, loadPlugins(), activatePlugin(), deactivatePlugin(), findByCommand()` |
| `PluginPicker.tsx` TopBar UI | ✅ Done | Dropdown with plugin list, active state, install button, deactivate ✕ |
| Slash command auto-activation | ✅ Done | `/review`, `/debug`, etc. parsed in `handleSend()` — strip prefix, route to plugin tier |
| `chatService.ts` systemPromptOverride | ✅ Done | Active plugin's `systemPrompt` replaces A.R.C. prompt when set |
| `chatService.ts` tierOverride | ✅ Done | Plugin tier overrides 3-tier router decision |
| Routing preview shows plugin name | ✅ Done | "→ A.R.C. Plugin: Code Reviewer" visible before send |
| Layout bootstrap | ✅ Done | `loadPlugins()` called in `Promise.all` alongside settings/conversations/cost |

### P9 — WBS Completion Pass ✅ Complete

| Task | WBS ID | Status | Notes |
|------|--------|--------|-------|
| Conversation tags | P9.5 | ✅ Done | Tag badges on ConversationItem, autocomplete input, tag filter chips in ConversationList, `getAllTags()` + `tagFilter` + `setTagFilter()` in store |
| Native Mac app menu | P10.3 | ✅ Done | Full Mac menu bar: File/Edit/View/Window/Help; Cmd+K, Cmd+, Cmd+Shift+E; `menu:*` IPC events to renderer |
| System tray icon | P10.4 | ✅ Done | Tray with click toggle (show/hide), context menu (Show, New Chat, Quit) |
| README documentation | P10.5 | ✅ Done | Full README with setup, shortcuts, plugin format, architecture |
| Final testing / zero TS errors | P10.6 | ✅ Done | `tsc --noEmit` passes with 0 errors; pre-existing bugs fixed (unused imports, cacheReadTokens, unused router.ts deleted) |

---

## Architecture Decisions

**IPC Streaming Pattern** — All API calls (Ollama, Claude, Fabric) run in the Electron main process to avoid CORS. Tokens streamed back to renderer via `event.sender.send(`stream-${streamId}`, data)`. UUID-based stream IDs prevent collisions. AbortController wired through for stop functionality.

**3-Tier Routing** — `routeQuery()` in MessageInput makes automatic tier decisions based on: query complexity, word count, code detection, budget guard, user aggressiveness setting. Routing reason shown in chat when enabled.

**Prompt Caching** — A.R.C. system prompt sent with `cache_control: { type: 'ephemeral' }`. Anthropic caches for 5 minutes, reducing input token cost by ~90% on subsequent calls.

**Fabric REST vs child_process** — Original WBS suggested spawning `fabric` as a child process. We use the REST API (`fabric --serve`) instead — cleaner, no stdout parsing, easier streaming.

---

## File Tree

```
arc-hub/
├── src/
│   ├── main/
│   │   ├── main.ts              ← IPC handlers for Ollama, Claude, Fabric, services, plugins
│   │   ├── database/
│   │   │   ├── db.ts            ← SQLite singleton
│   │   │   ├── schema.ts        ← 4-table schema
│   │   │   └── operations.ts    ← CRUD helpers
│   │   └── plugins/
│   │       └── loader.ts        ← Scan ~/.noah-ai-hub/plugins/, seed samples
│   ├── preload/
│   │   └── preload.ts           ← contextBridge security bridge
│   └── renderer/
│       ├── electron.d.ts        ← TypeScript types for window.electron
│       ├── stores/
│       │   ├── types.ts
│       │   ├── conversationStore.ts
│       │   ├── settingsStore.ts
│       │   ├── serviceStore.ts
│       │   └── costStore.ts
│       ├── services/
│       │   ├── arcLoader.ts     ← Load A.R.C. SKILL.md prompt
│       │   ├── chatService.ts   ← Route to Ollama / Haiku / Sonnet
│       │   ├── ollamaService.ts ← IPC streaming wrapper
│       │   ├── claudeService.ts ← IPC streaming wrapper
│       │   └── fabricService.ts ← IPC streaming wrapper (new in P5)
│       └── components/
│           ├── Layout.tsx
│           ├── Sidebar.tsx
│           ├── TopBar.tsx
│           ├── ChatArea.tsx
│           ├── MessageInput.tsx
│           ├── messages/
│           ├── services/
│           ├── conversations/
│           ├── cost/
│           ├── models/
│           ├── patterns/
│           │   └── PatternSelector.tsx  ← Fully wired (new in P5)
│           ├── plugins/
│           │   └── PluginPicker.tsx     ← Dropdown in TopBar (new in P8)
│           └── settings/
```

---

*This file is updated after each completed phase step.*
