import { loadArcPrompt } from './arcLoader'
import { MemoryCitation, sourceLabel } from './memoryService'
import { ModelTier, Plugin } from '../stores/types'
import { TraceEntry, useTraceStore } from '../stores/traceStore'

export interface CanonicalChainOptions {
  prompt: string
  conversationId: string
  conversationHistory: Array<{ role: string; content: string }>
  memoryCitations: MemoryCitation[]
  plugin: Plugin | null
  services: {
    openClawRunning: boolean
    fabricRunning: boolean
  }
}

export interface CanonicalChainResult {
  rebuiltUserPrompt: string
  rebuiltSystemPrompt: string
  routingPrompt: string
  openClawTierOverride?: ModelTier
}

const appendTrace = (entry: Omit<TraceEntry, 'id' | 'timestamp'>) => useTraceStore.getState().appendEntry(entry)

function buildMemorySection(memoryCitations: MemoryCitation[]): string {
  if (memoryCitations.length === 0) return 'No ARC-Memory citations staged for this request.'
  return memoryCitations
    .map((citation, index) => (
      `${index + 1}. ${citation.title} (${sourceLabel(citation.source_type)}, ${citation.date})\n${citation.excerpt}`
    ))
    .join('\n\n')
}

function buildConversationSection(history: Array<{ role: string; content: string }>): string {
  const recent = history
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-6)
  if (recent.length === 0) return 'No prior conversation history.'
  return recent
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n')
}

function mapOpenClawTier(value?: string): ModelTier | undefined {
  if (value === 'ollama' || value === 'haiku' || value === 'arc-sonnet' || value === 'arc-opus') {
    return value
  }
  return undefined
}

export async function executeCanonicalChain(opts: CanonicalChainOptions): Promise<CanonicalChainResult> {
  appendTrace({
    source: 'chat',
    level: 'info',
    title: 'Received user prompt',
    detail: 'ARCOS has started the canonical execution chain for this request.',
    conversationId: opts.conversationId,
    stage: 'user prompt',
    executionState: 'query_received',
    relatedPanels: ['chat', 'transparency', 'execution'],
  })

  appendTrace({
    source: 'memory',
    level: 'info',
    title: 'Assembling PAI core context',
    detail: 'Loading baseline ARC prompt, recent thread context, plugin contract, and staged memory for the request.',
    conversationId: opts.conversationId,
    stage: 'PAI core context',
    executionState: 'context_loading',
    relatedPanels: ['prompt_inspector', 'memory', 'transparency'],
  })

  const { prompt: arcPrompt, source } = await loadArcPrompt()
  const memorySection = buildMemorySection(opts.memoryCitations)
  const conversationSection = buildConversationSection(opts.conversationHistory)
  const pluginSummary = opts.plugin
    ? `${opts.plugin.name} (${opts.plugin.architectureRole}) targeting ${opts.plugin.targetStages.join(', ')}`
    : 'No active plugin.'

  appendTrace({
    source: 'memory',
    level: 'success',
    title: 'PAI core context ready',
    detail: `${opts.memoryCitations.length} memory citations and ${Math.min(opts.conversationHistory.length, 6)} recent conversation items were prepared. ARC prompt source: ${source}.`,
    conversationId: opts.conversationId,
    stage: 'PAI core context',
    executionState: 'context_loading',
    relatedPanels: ['prompt_inspector', 'memory', 'transparency'],
  })

  appendTrace({
    source: 'service',
    level: opts.services.openClawRunning ? 'info' : 'warn',
    title: opts.services.openClawRunning ? 'OpenClaw stage engaged' : 'OpenClaw stage degraded',
    detail: opts.services.openClawRunning
      ? 'Loading linked OpenClaw workspace context before downstream prompt shaping.'
      : 'OpenClaw service is not running. ARCOS will still load workspace context files, but live OpenClaw orchestration is unavailable.',
    conversationId: opts.conversationId,
    stage: 'OpenClaw',
    executionState: 'service_action',
    relatedPanels: ['services', 'runtime', 'transparency'],
    degraded: !opts.services.openClawRunning,
  })

  const openClawContext = await window.electron.openClawContext()
  const openClawFiles = openClawContext.success ? (openClawContext.files ?? []) : []
  const openClawContextBlock = openClawFiles.length === 0
    ? 'No OpenClaw workspace context files were available.'
    : openClawFiles.map((file) => `# ${file.name}\n${file.content}`).join('\n\n')

  let openClawAnalysisBlock = 'No live OpenClaw gateway analysis was available.'
  let openClawTierOverride: ModelTier | undefined
  let fabricPatternSuggestion: string | null = null

  if (opts.services.openClawRunning) {
    const analysisResult = await window.electron.openClawAnalyze({
      conversationId: opts.conversationId,
      prompt: opts.prompt,
      conversationSection,
      memorySection,
      pluginSummary,
    })

    if (analysisResult.success && analysisResult.analysis) {
      const analysis = analysisResult.analysis
      openClawTierOverride = mapOpenClawTier(analysis.recommended_tier)
      fabricPatternSuggestion = analysis.should_use_fabric ? (analysis.fabric_pattern ?? null) : null
      openClawAnalysisBlock = [
        `Summary: ${analysis.summary ?? 'n/a'}`,
        `Intent: ${analysis.intent ?? 'n/a'}`,
        `Workflow: ${analysis.workflow ?? 'n/a'}`,
        `Recommended tier: ${analysis.recommended_tier ?? 'none'}`,
        `Recommended model: ${analysis.recommended_model ?? 'none'}`,
        `Fabric: ${analysis.should_use_fabric ? `yes${analysis.fabric_pattern ? ` (${analysis.fabric_pattern})` : ''}` : 'no'}`,
        `Confidence: ${analysis.confidence ?? 'n/a'}`,
        `Reasoning: ${analysis.reasoning ?? 'n/a'}`,
        analysis.notes && analysis.notes.length > 0 ? `Notes: ${analysis.notes.join(' | ')}` : '',
      ].filter(Boolean).join('\n')

      appendTrace({
        source: 'service',
        level: 'success',
        title: 'OpenClaw gateway analysis completed',
        detail: [
          analysis.summary ?? 'No summary returned.',
          openClawTierOverride ? `Tier recommendation: ${openClawTierOverride}.` : '',
          fabricPatternSuggestion ? `Fabric suggestion: ${fabricPatternSuggestion}.` : '',
        ].filter(Boolean).join(' '),
        conversationId: opts.conversationId,
        stage: 'OpenClaw',
        executionState: 'service_action',
        relatedPanels: ['services', 'runtime', 'transparency', 'execution'],
      })
    } else {
      appendTrace({
        source: 'service',
        level: 'warn',
        title: 'OpenClaw gateway analysis failed',
        detail: analysisResult.error ?? 'OpenClaw did not return a usable orchestration result.',
        conversationId: opts.conversationId,
        stage: 'OpenClaw',
        executionState: 'degraded',
        relatedPanels: ['services', 'runtime', 'transparency'],
        degraded: true,
        failureType: 'service_health',
      })
    }
  }

  appendTrace({
    source: 'service',
    level: openClawContext.success ? 'success' : 'warn',
    title: openClawContext.success ? 'OpenClaw context loaded' : 'OpenClaw context unavailable',
    detail: openClawContext.success
      ? `${openClawFiles.length} workspace files loaded from ${openClawContext.workspacePath ?? 'OpenClaw workspace'}.`
      : openClawContext.error ?? 'OpenClaw workspace context was unavailable.',
    conversationId: opts.conversationId,
    stage: 'OpenClaw',
    executionState: 'service_action',
    relatedPanels: ['services', 'runtime', 'prompt_inspector'],
    degraded: !openClawContext.success,
  })

  appendTrace({
    source: 'fabric',
    level: opts.services.fabricRunning ? (fabricPatternSuggestion ? 'success' : 'info') : 'warn',
    title: opts.services.fabricRunning
      ? (fabricPatternSuggestion ? 'Fabric skill suggested' : 'Fabric stage evaluated')
      : 'Fabric stage degraded',
    detail: opts.services.fabricRunning
      ? (fabricPatternSuggestion
          ? `OpenClaw suggested the Fabric pattern "${fabricPatternSuggestion}" for this request. ARCOS is recording the recommendation, but automatic Fabric execution is not wired into chat yet.`
          : 'Fabric is participating in the chain as a shaping checkpoint for this request. No Fabric pattern was selected.')
      : 'Fabric is offline. The chain continues with a direct pass-through at the Fabric stage.',
    conversationId: opts.conversationId,
    stage: 'Fabric',
    executionState: 'tool_running',
    relatedPanels: ['tools', 'services', 'transparency'],
    degraded: !opts.services.fabricRunning,
  })

  appendTrace({
    source: 'chat',
    level: 'info',
    title: 'Rebuilding final prompt',
    detail: 'ARCOS is merging PAI core context, OpenClaw context, memory citations, and the user request into a final model-ready prompt.',
    conversationId: opts.conversationId,
    stage: 'prompt rebuilder',
    executionState: 'model_dispatch',
    relatedPanels: ['prompt_inspector', 'transparency', 'execution'],
  })

  const rebuiltSystemPrompt = [
    arcPrompt,
    '',
    '## PAI Core Context',
    '',
    `Active plugin: ${opts.plugin ? `${opts.plugin.name} (${opts.plugin.architectureRole})` : 'none'}`,
    `Plugin target stages: ${opts.plugin ? opts.plugin.targetStages.join(', ') : 'none'}`,
    '',
    '### Recent Thread Context',
    conversationSection,
    '',
    '### ARC-Memory Context',
    memorySection,
    '',
    '### OpenClaw Workspace Context',
    openClawContextBlock,
    '',
    '### OpenClaw Gateway Analysis',
    openClawAnalysisBlock,
    '',
    '## Execution Requirement',
    'You are responding through the ARCOS canonical execution chain. Respect the PAI context above when producing the response.',
    opts.plugin ? `## Active Plugin Override\n${opts.plugin.systemPrompt}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const rebuiltUserPrompt = [
    opts.prompt,
    '',
    '## Request Handling Note',
    'The response must remain consistent with the PAI core context, OpenClaw workspace context, and any staged memory supplied above.',
  ].join('\n')

  appendTrace({
    source: 'chat',
    level: 'success',
    title: 'Prompt rebuilt',
    detail: `Final system prompt size: ${rebuiltSystemPrompt.length} chars. Final user payload size: ${rebuiltUserPrompt.length} chars.`,
    conversationId: opts.conversationId,
    stage: 'prompt rebuilder',
    executionState: 'model_dispatch',
    relatedPanels: ['prompt_inspector', 'transparency', 'execution'],
  })

  return {
    rebuiltUserPrompt,
    rebuiltSystemPrompt,
    routingPrompt: [
      opts.prompt,
      '',
      memorySection,
      '',
      openClawAnalysisBlock,
    ].join('\n'),
    openClawTierOverride,
  }
}
