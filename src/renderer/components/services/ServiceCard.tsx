import { useState } from 'react'
import { ServiceStatus } from '../../stores/types'
import { useServiceStore } from '../../stores/serviceStore'
import StatusIndicator from './StatusIndicator'
import ServiceButton from './ServiceButton'

export default function ServiceCard({ service }: { service: ServiceStatus }) {
  const [logsOpen, setLogsOpen] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const startService = useServiceStore((s) => s.startService)
  const stopService = useServiceStore((s) => s.stopService)

  const handleRestart = async () => {
    setRestarting(true)
    await stopService(service.name)
    await new Promise((r) => setTimeout(r, 800))
    await startService(service.name)
    setRestarting(false)
  }

  const statusLabel = service.checking
    ? 'Checking...'
    : restarting
    ? 'Restarting...'
    : service.running
    ? 'Running'
    : 'Stopped'

  return (
    <div
      className={`bg-background rounded-lg border p-3 space-y-2 transition-colors duration-300 ${
        service.running ? 'border-success/25' : 'border-border'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIndicator running={service.running} checking={service.checking || restarting} />
          <span className="text-sm font-medium text-text">{service.displayName}</span>
          <span className="text-xs text-text-muted">:{service.port}</span>
        </div>
        <span
          className={`text-xs font-medium transition-colors ${
            service.running ? 'text-success' : service.checking || restarting ? 'text-warning' : 'text-text-muted'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {!service.running ? (
          <ServiceButton
            label="Start"
            variant="start"
            disabled={service.checking || restarting}
            onClick={() => startService(service.name)}
          />
        ) : (
          <ServiceButton
            label="Stop"
            variant="stop"
            disabled={service.checking || restarting}
            onClick={() => stopService(service.name)}
          />
        )}
        <ServiceButton
          label={restarting ? 'Restarting...' : 'Restart'}
          variant="restart"
          disabled={service.checking || restarting}
          onClick={handleRestart}
        />
        <button
          onClick={() => setLogsOpen((v) => !v)}
          className="ml-auto text-xs text-text-muted hover:text-text transition-colors"
        >
          Logs {logsOpen ? '▾' : '▸'}
        </button>
      </div>

      {/* Error */}
      {service.error && (
        <p className="text-xs text-danger bg-danger/10 rounded px-2 py-1">{service.error}</p>
      )}

      {/* Logs panel */}
      {logsOpen && (
        <div className="bg-surface-elevated rounded p-2 text-xs font-mono min-h-[40px] space-y-0.5">
          {service.running ? (
            <>
              <p className="text-success">{service.displayName} is running</p>
              <p className="text-text-muted">Listening on port {service.port}</p>
              {service.name === 'ollama' && (
                <p className="text-text-muted">API: http://localhost:{service.port}/api</p>
              )}
              {service.name === 'fabric' && (
                <p className="text-text-muted">REST: http://localhost:{service.port}/api/patterns</p>
              )}
            </>
          ) : (
            <p className="text-text-muted italic">Service not running</p>
          )}
        </div>
      )}
    </div>
  )
}
