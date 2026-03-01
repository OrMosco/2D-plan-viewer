import { useRef, useState, useEffect, useCallback } from 'react'
import { LogEntry } from '../types'

interface PlanViewerProps {
  addLog: (action: LogEntry['action'], details: string) => void
  currentPlanImage: string | null
  isAnalyzing: boolean
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 5
const ZOOM_SENSITIVITY = 0.001
const BASE_URL = import.meta.env.BASE_URL

function PlanViewer({ addLog, currentPlanImage, isAnalyzing }: PlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const positionRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Keep refs in sync
  useEffect(() => {
    positionRef.current = position
  }, [position])
  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  // Center image on load
  const handleImageLoad = useCallback(() => {
    if (!containerRef.current || !imgRef.current) return
    const container = containerRef.current.getBoundingClientRect()
    const img = imgRef.current

    const scaleX = container.width / img.naturalWidth
    const scaleY = container.height / img.naturalHeight
    const fitScale = Math.min(scaleX, scaleY) * 0.9

    const newX = (container.width - img.naturalWidth * fitScale) / 2
    const newY = (container.height - img.naturalHeight * fitScale) / 2

    setScale(fitScale)
    setPosition({ x: newX, y: newY })
    setImageLoaded(true)
  }, [])

  // Reset view (double-click)
  const resetView = useCallback(() => {
    if (!containerRef.current || !imgRef.current) return
    const container = containerRef.current.getBoundingClientRect()
    const img = imgRef.current

    const scaleX = container.width / img.naturalWidth
    const scaleY = container.height / img.naturalHeight
    const fitScale = Math.min(scaleX, scaleY) * 0.9

    const newX = (container.width - img.naturalWidth * fitScale) / 2
    const newY = (container.height - img.naturalHeight * fitScale) / 2

    setScale(fitScale)
    setPosition({ x: newX, y: newY })
    addLog('Reset', '🔄 View centered, fit to screen')
  }, [addLog])

  // Zoom handler (cursor-centered)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top

    const currentScale = scaleRef.current
    const currentPos = positionRef.current

    const delta = -e.deltaY * ZOOM_SENSITIVITY
    const zoomFactor = 1 + delta
    let newScale = currentScale * zoomFactor

    // Clamp
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale))

    // Adjust position so cursor point stays stationary
    const scaleChange = newScale / currentScale
    const newX = cursorX - (cursorX - currentPos.x) * scaleChange
    const newY = cursorY - (cursorY - currentPos.y) * scaleChange

    setScale(newScale)
    setPosition({ x: newX, y: newY })

    const action = newScale > currentScale ? 'Zoom In' : 'Zoom Out'
    const emoji = newScale > currentScale ? '🔍' : '🔎'
    addLog(action, `${emoji} ${newScale.toFixed(2)}x`)
  }, [addLog])

  // Attach wheel listener (passive: false needed for preventDefault)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // left button only
    setIsPanning(true)
    panStart.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    const newX = e.clientX - panStart.current.x
    const newY = e.clientY - panStart.current.y
    setPosition({ x: newX, y: newY })
  }, [isPanning])

  const handleMouseUp = useCallback(() => {
    if (!isPanning) return
    setIsPanning(false)
    const pos = positionRef.current
    const dx = Math.round(pos.x - (panStart.current.x !== 0 ? pos.x : 0))
    const dy = Math.round(pos.y - (panStart.current.y !== 0 ? pos.y : 0))
    addLog('Pan', `↔️ x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`)
  }, [isPanning, addLog])

  // Global mouse up to handle drag outside viewer
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false)
        const pos = positionRef.current
        addLog('Pan', `↔️ x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`)
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isPanning, addLog])

  // Double-click reset
  const handleDoubleClick = useCallback(() => {
    resetView()
  }, [resetView])

  const imageSrc = currentPlanImage || `${BASE_URL}foundation-plan.png`;

  return (
    <div className="viewer-container">
      <div className="viewer-toolbar">
        <div className="viewer-toolbar-left">
          <span className="toolbar-badge">
            🔍 Zoom: {scale.toFixed(2)}x
          </span>
          <span className="toolbar-badge">
            📍 x: {Math.round(position.x)}, y: {Math.round(position.y)}
          </span>
          {currentPlanImage && (
            <span className="toolbar-badge ai-badge">
              🤖 AI Annotated
            </span>
          )}
        </div>
        <span className="toolbar-hint">
          💡 Scroll to zoom • Drag to pan • Double-click to reset
        </span>
      </div>
      <div
        ref={containerRef}
        className="viewer-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {isAnalyzing && (
          <div className="viewer-loading-overlay">
            <div className="viewer-loading-spinner" />
            <div className="viewer-loading-text">🤖 Analyzing structure…</div>
          </div>
        )}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Foundation Plan"
          onLoad={handleImageLoad}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            opacity: imageLoaded ? 1 : 0,
            transition: isPanning ? 'none' : 'opacity 0.3s ease',
          }}
          draggable={false}
        />
      </div>
    </div>
  )
}

export default PlanViewer
