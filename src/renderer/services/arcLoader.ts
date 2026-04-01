const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

let cachedPrompt: string | null = null
let cachedSource: string | null = null
let cacheTimestamp = 0

const FALLBACK_PROMPT = `You are A.R.C. (AI Reasoning Companion), a helpful, precise AI assistant. You are deeply curious, direct, and analytical. You help users think through problems carefully and thoroughly. You use markdown formatting for code and structured responses. You are honest about uncertainty and prefer concise, accurate answers over verbose ones.`

export async function loadArcPrompt(): Promise<{ prompt: string; source: string }> {
  const now = Date.now()
  if (cachedPrompt && now - cacheTimestamp < CACHE_TTL) {
    return { prompt: cachedPrompt, source: cachedSource ?? 'cache' }
  }

  try {
    const result = await window.electron.loadArcPrompts()
    if (result.success && result.content) {
      cachedPrompt = result.content
      cachedSource = result.source ?? 'unknown'
      cacheTimestamp = now
      console.log('[A.R.C.] Loaded prompts from:', cachedSource)
      return { prompt: cachedPrompt, source: cachedSource }
    }
    console.warn('[A.R.C.] Could not load prompts:', result.error, '— using fallback')
  } catch (e) {
    console.warn('[A.R.C.] IPC error loading prompts:', e)
  }

  return { prompt: FALLBACK_PROMPT, source: 'fallback' }
}

export function invalidateCache() {
  cachedPrompt = null
  cacheTimestamp = 0
}
