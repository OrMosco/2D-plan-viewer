import { useState, useCallback } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import PlanViewer from './components/PlanViewer'
import ActionLog from './components/ActionLog'
import { LogEntry } from './types'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [nextId, setNextId] = useState(1)

  // Apply theme to document
  document.documentElement.setAttribute('data-theme', theme)

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      return next
    })
  }, [])

  const addLog = useCallback((action: LogEntry['action'], details: string) => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + String(now.getMilliseconds()).padStart(3, '0')

    setLogs(prev => [{
      id: nextId,
      timestamp,
      action,
      details,
    }, ...prev])
    setNextId(prev => prev + 1)
  }, [nextId])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return (
    <div className="app">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <div className="main-content">
        <PlanViewer addLog={addLog} />
        <ActionLog logs={logs} onClear={clearLogs} />
      </div>
      <Footer />
    </div>
  )
}

export default App
