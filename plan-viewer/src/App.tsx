import { useState, useCallback } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import PlanViewer from './components/PlanViewer'
import ActionLog from './components/ActionLog'
import AnalysisPanel from './components/AnalysisPanel'
import { LogEntry } from './types'
import { analyzeStructure } from './services/geminiService'

const BASE_URL = import.meta.env.BASE_URL

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [nextId, setNextId] = useState(1)

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysisText, setAiAnalysisText] = useState<string | null>(null)
  const [currentPlanImage, setCurrentPlanImage] = useState<string | null>(null)

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

  const handleAnalyze = useCallback(async () => {
    if (isAnalyzing) return

    setIsAnalyzing(true)
    addLog('AI Analysis', '🤖 AI Structural Analysis requested...')

    try {
      const imageUrl = `${BASE_URL}foundation-plan.png`
      const result = await analyzeStructure(imageUrl)

      if (result.annotatedImageUrl) {
        setCurrentPlanImage(result.annotatedImageUrl)
      }
      if (result.structuralAnalysisSummary) {
        setAiAnalysisText(result.structuralAnalysisSummary)
      }

      addLog('AI Analysis', '✅ AI Analysis complete and applied.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addLog('AI Analysis', `❌ AI Analysis failed: ${message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }, [isAnalyzing, addLog])

  const closeAnalysisPanel = useCallback(() => {
    setAiAnalysisText(null)
  }, [])

  return (
    <div className="app">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />
      <div className="main-content">
        <PlanViewer
          addLog={addLog}
          currentPlanImage={currentPlanImage}
          isAnalyzing={isAnalyzing}
        />
        {aiAnalysisText ? (
          <AnalysisPanel text={aiAnalysisText} onClose={closeAnalysisPanel} />
        ) : (
          <ActionLog logs={logs} onClear={clearLogs} />
        )}
      </div>
      <Footer />
    </div>
  )
}

export default App
