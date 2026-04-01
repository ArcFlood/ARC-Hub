export interface StreamCallbacks {
  onToken: (token: string) => void
  onComplete: (fullText: string, evalTokens?: number) => void
  onError: (error: Error) => void
}

export async function streamOllamaChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const streamId = crypto.randomUUID()
  let fullText = ''

  return new Promise<void>((resolve) => {
    const cleanup = window.electron.onStreamEvent(streamId, (raw) => {
      const data = raw as { type: string; token?: string; fullText?: string; evalTokens?: number; error?: string }

      if (data.type === 'token' && data.token) {
        fullText += data.token
        callbacks.onToken(data.token)
      } else if (data.type === 'done') {
        cleanup()
        callbacks.onComplete(data.fullText ?? fullText, data.evalTokens)
        resolve()
      } else if (data.type === 'error') {
        cleanup()
        callbacks.onError(new Error(data.error ?? 'Unknown Ollama error'))
        resolve()
      }
    })

    signal?.addEventListener('abort', () => {
      cleanup()
      window.electron.streamAbort(streamId)
      resolve()
    })

    window.electron.ollamaStreamStart({ streamId, model, messages })
  })
}

export async function listOllamaModels(): Promise<string[]> {
  const result = await window.electron.ollamaListModels()
  return result.models ?? []
}
