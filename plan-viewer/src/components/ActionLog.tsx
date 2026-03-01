import { LogEntry } from '../types'

interface ActionLogProps {
  logs: LogEntry[]
  onClear: () => void
}

function getActionClass(action: LogEntry['action']): string {
  switch (action) {
    case 'Zoom In': return 'zoom-in'
    case 'Zoom Out': return 'zoom-out'
    case 'Pan': return 'pan'
    case 'Reset': return 'reset'
    case 'AI Analysis': return 'ai-analysis'
    default: return ''
  }
}

function getActionEmoji(action: LogEntry['action']): string {
  switch (action) {
    case 'Zoom In': return '🔍'
    case 'Zoom Out': return '🔎'
    case 'Pan': return '↔️'
    case 'Reset': return '🔄'
    case 'AI Analysis': return '🤖'
    default: return '📌'
  }
}

function ActionLog({ logs, onClear }: ActionLogProps) {
  return (
    <aside className="action-log">
      <div className="log-header">
        <div className="log-title">
          📊 Action Log
          {logs.length > 0 && (
            <span className="log-count">{logs.length}</span>
          )}
        </div>
        {logs.length > 0 && (
          <button className="log-clear-btn" onClick={onClear}>
            🗑️ Clear
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="log-empty">
          <div className="log-empty-icon">📋</div>
          <div className="log-empty-text">No actions yet</div>
          <div className="log-empty-hint">
            Start interacting with the plan viewer!<br/>
            🔍 Scroll to zoom • ↔️ Drag to pan • 🔄 Double-click to reset
          </div>
        </div>
      ) : (
        <div className="log-table-container">
          <table className="log-table">
            <thead>
              <tr>
                <th>⏰ Time</th>
                <th>⚡ Action</th>
                <th className="details-col">📝 Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className="log-timestamp">{log.timestamp}</span>
                  </td>
                  <td>
                    <span className={`log-action-badge ${getActionClass(log.action)}`}>
                      {getActionEmoji(log.action)} {log.action}
                    </span>
                  </td>
                  <td className="details-col">
                    <span className="log-details">{log.details}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </aside>
  )
}

export default ActionLog
