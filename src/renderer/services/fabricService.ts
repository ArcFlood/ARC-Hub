/**
 * fabricService.ts
 * Wraps Fabric REST API calls via IPC (main process handles HTTP — no CORS).
 * Fabric server runs at http://localhost:8080 (fabric --serve).
 */

export interface FabricStreamCallbacks {
  onMeta?: (meta: { mode: 'server' | 'cli'; stage?: string }) => void
  onToken: (token: string) => void
  onComplete: (fullText: string) => void
  onError: (err: Error) => void
}

// ── Pattern list ──────────────────────────────────────────────────

/** Fetch installed Fabric patterns from the REST server. Falls back to [] on failure. */
export async function listFabricPatterns(): Promise<string[]> {
  try {
    const result = await window.electron.fabricListPatterns()
    return result.success ? result.patterns : []
  } catch {
    return []
  }
}

// ── Pattern execution ─────────────────────────────────────────────

/**
 * Run a Fabric pattern on the given input text.
 * Streams tokens back via callbacks.
 * Returns a cleanup/abort function.
 */
export function runFabricPattern(
  pattern: string,
  input: string,
  callbacks: FabricStreamCallbacks,
  signal?: AbortSignal
): void {
  const streamId = crypto.randomUUID()

  const cleanup = window.electron.onStreamEvent(streamId, (raw: unknown) => {
    const data = raw as { type: string; token?: string; fullText?: string; error?: string; mode?: 'server' | 'cli'; stage?: string }

    if (data.type === 'meta' && data.mode) {
      callbacks.onMeta?.({ mode: data.mode, stage: data.stage })
    } else if (data.type === 'token' && data.token) {
      callbacks.onToken(data.token)
    } else if (data.type === 'done') {
      cleanup()
      callbacks.onComplete(data.fullText ?? '')
    } else if (data.type === 'error') {
      cleanup()
      callbacks.onError(new Error(data.error ?? 'Fabric pattern failed'))
    }
  })

  // Abort support
  if (signal) {
    signal.addEventListener('abort', () => {
      cleanup()
      window.electron.streamAbort(streamId)
    })
  }

  // Fire the IPC call (non-blocking)
  window.electron.fabricRunPattern({ streamId, pattern, input }).catch((e: unknown) => {
    cleanup()
    callbacks.onError(new Error(String(e)))
  })
}

// ── Pattern metadata ─────────────────────────────────────────────

/** Human-readable label for a snake_case pattern id */
export function patternLabel(id: string): string {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Short description heuristics for common patterns */
const KNOWN_DESCRIPTIONS: Record<string, string> = {
  extract_wisdom: 'Pull insights, quotes, and key ideas',
  summarize: 'Concise summary of content',
  explain_code: 'Break down what code does',
  improve_writing: 'Enhance clarity and style',
  create_quiz: 'Generate questions from content',
  analyze_claims: 'Evaluate arguments and evidence',
  create_summary: 'Structured TLDR with key points',
  extract_ideas: 'Surface novel ideas from text',
  write_essay: 'Write a structured essay on a topic',
  create_markmap: 'Visual mind-map from content',
  rate_content: 'Rate quality and give feedback',
  create_keynote: 'Build a presentation outline',
  extract_sponsors: 'Find sponsored content and ads',
  find_logical_fallacies: 'Identify reasoning errors',
  ask_secure_by_design: 'Security review of a design',
  show_fabric_options_markmap: 'Mind-map of Fabric options',
}

export function patternDescription(id: string): string {
  return KNOWN_DESCRIPTIONS[id] ?? 'Apply AI pattern to your content'
}

/** Pick a display emoji for a pattern */
export function patternEmoji(id: string): string {
  if (id.includes('wisdom') || id.includes('idea')) return '💡'
  if (id.includes('summar') || id.includes('tldr')) return '📋'
  if (id.includes('code') || id.includes('debug')) return '🔍'
  if (id.includes('writ') || id.includes('essay')) return '✍️'
  if (id.includes('quiz') || id.includes('question')) return '❓'
  if (id.includes('claim') || id.includes('logic') || id.includes('fallac')) return '⚖️'
  if (id.includes('secur')) return '🔒'
  if (id.includes('rate') || id.includes('review')) return '⭐'
  if (id.includes('keynote') || id.includes('slide')) return '📊'
  if (id.includes('sponsor')) return '🏷️'
  return '◈'
}
