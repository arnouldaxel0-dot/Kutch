import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { Tool } from '../App'
import type { Plan, PerimeterGroup, PerimeterPath, Point } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

interface DrawingState {
  groupId: string
  color: string
  thickness: number
}

interface MainCanvasProps {
  activeTool: Tool
  zoom: number
  activePlan: Plan | null
  projectName?: string
  drawingState: DrawingState | null
  onPathFinished: (groupId: string, path: PerimeterPath) => void
  onCancelDrawing: () => void
  perimeterGroups: PerimeterGroup[]
}

const TOOL_CURSORS: Record<Tool, string> = {
  pointer: 'default',
  cadrage: 'crosshair',
  surface: 'crosshair',
  perimetre: 'crosshair',
  distance: 'crosshair',
  compteur: 'cell',
  angle: 'crosshair',
  marquer: 'crosshair',
  note: 'text',
}

const calcLength = (points: Point[]) =>
  points.slice(1).reduce((sum, p, i) => {
    const dx = p.x - points[i].x
    const dy = p.y - points[i].y
    return sum + Math.sqrt(dx * dx + dy * dy)
  }, 0)

export default function MainCanvas({
  activeTool,
  zoom: _zoom,
  activePlan,
  projectName,
  drawingState,
  onPathFinished,
  onCancelDrawing,
  perimeterGroups,
}: MainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [pdfSize, setPdfSize] = useState({ width: 800, height: 566 })
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [mousePos, setMousePos] = useState<Point | null>(null)
  const isPanning = useRef(false)
  const lastPanPoint = useRef({ x: 0, y: 0 })
  const panRef = useRef(pan)
  const scaleRef = useRef(scale)

  // Keep refs in sync
  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { scaleRef.current = scale }, [scale])

  // Render PDF when activePlan changes
  useEffect(() => {
    if (!activePlan?.file || !pdfCanvasRef.current) return

    let cancelled = false
    const file = activePlan.file

    const renderPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        if (cancelled) return
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        if (cancelled) return
        const page = await pdf.getPage(1)
        if (cancelled) return

        const viewport = page.getViewport({ scale: 2 })
        const canvas = pdfCanvasRef.current!
        canvas.width = viewport.width
        canvas.height = viewport.height
        setPdfSize({ width: viewport.width, height: viewport.height })

        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise
      } catch (err) {
        console.error('PDF render error:', err)
      }
    }

    renderPdf()
    return () => { cancelled = true }
  }, [activePlan?.file, activePlan?.id])

  // Reset drawing points when drawingState changes (new drawing session)
  useEffect(() => {
    setCurrentPoints([])
    setMousePos(null)
  }, [drawingState?.groupId])

  // Wheel zoom with passive: false
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * factor,
        y: mouseY - (mouseY - prev.y) * factor,
      }))
      setScale(prev => Math.min(5, Math.max(0.1, prev * factor)))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const screenToCanvas = useCallback((clientX: number, clientY: number): Point => {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - panRef.current.x) / scaleRef.current,
      y: (clientY - rect.top - panRef.current.y) / scaleRef.current,
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button → start pan
    if (e.button === 1) {
      e.preventDefault()
      isPanning.current = true
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
      return
    }

    // Left click in perimeter drawing mode
    if (e.button === 0 && drawingState) {
      const pt = screenToCanvas(e.clientX, e.clientY)
      setCurrentPoints(prev => [...prev, pt])
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPanPoint.current.x
      const dy = e.clientY - lastPanPoint.current.y
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      return
    }

    if (drawingState) {
      setMousePos(screenToCanvas(e.clientX, e.clientY))
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1) {
      isPanning.current = false
    }
  }

  const handleMouseLeave = () => {
    isPanning.current = false
    setMousePos(null)
  }

  // Right-click → finish path
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!drawingState || currentPoints.length < 2) {
      if (drawingState && currentPoints.length < 2) {
        // Not enough points, just cancel
        setCurrentPoints([])
        return
      }
      return
    }
    const length = calcLength(currentPoints)
    const path: PerimeterPath = {
      id: crypto.randomUUID(),
      points: [...currentPoints],
      length,
    }
    onPathFinished(drawingState.groupId, path)
    setCurrentPoints([])
    setMousePos(null)
  }

  // Escape → cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingState) {
        setCurrentPoints([])
        setMousePos(null)
        onCancelDrawing()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawingState, onCancelDrawing])

  const isDrawing = !!drawingState

  // Build SVG path string from points
  const buildPathD = (points: Point[]) => {
    if (points.length < 2) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }

  const cursor = isDrawing ? 'crosshair' : TOOL_CURSORS[activeTool]

  return (
    <div
      className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col"
      style={{ cursor }}
    >
      {/* Plan title bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 border-b border-slate-700 shrink-0 backdrop-blur-sm">
        <span className="text-sm font-medium text-slate-200">
          {activePlan ? activePlan.name : <span className="text-slate-500 italic">Aucun plan ouvert</span>}
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {projectName && <span>{projectName}</span>}
          <span className="text-slate-600">|</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* Drawing mode indicator */}
      {isDrawing && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 bg-blue-600/90 rounded-full text-white text-xs font-medium shadow-lg pointer-events-none">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: drawingState.color }}
          />
          Mode dessin actif — Clic gauche: ajouter point · Clic droit: terminer · Échap: annuler
        </div>
      )}

      {/* Canvas area with blue border when drawing */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative ${isDrawing ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        {/* Empty state */}
        {!activePlan && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none z-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-sm font-medium">Aucun plan ouvert</p>
              <p className="text-slate-600 text-xs mt-1">Importez un PDF depuis la barre d'outils</p>
            </div>
          </div>
        )}

        {/* Transformed content */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* PDF canvas */}
          <canvas
            ref={pdfCanvasRef}
            style={{
              display: activePlan ? 'block' : 'none',
              width: pdfSize.width / 2,
              height: pdfSize.height / 2,
              imageRendering: 'pixelated',
            }}
          />

          {/* Fallback placeholder when no PDF file but plan exists (unlikely) */}
          {activePlan && !activePlan.file && (
            <div
              className="bg-white flex items-center justify-center text-slate-400 text-sm"
              style={{ width: 800, height: 566 }}
            >
              Plan sans fichier PDF
            </div>
          )}

          {/* SVG overlay for drawing */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: activePlan ? pdfSize.width / 2 : 800,
              height: activePlan ? pdfSize.height / 2 : 566,
              overflow: 'visible',
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Existing finished paths from all groups */}
            {perimeterGroups.map(group =>
              group.paths.map(path => (
                <path
                  key={path.id}
                  d={buildPathD(path.points)}
                  fill="none"
                  stroke={group.color}
                  strokeWidth={group.thickness}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))
            )}

            {/* Dot markers for existing paths */}
            {perimeterGroups.map(group =>
              group.paths.map(path =>
                path.points.map((pt, i) => (
                  <circle
                    key={`${path.id}-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={3 / scale}
                    fill={group.color}
                    stroke="white"
                    strokeWidth={1 / scale}
                  />
                ))
              )
            )}

            {/* Current drawing path */}
            {drawingState && currentPoints.length >= 2 && (
              <path
                d={buildPathD(currentPoints)}
                fill="none"
                stroke={drawingState.color}
                strokeWidth={drawingState.thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Preview line to cursor */}
            {drawingState && currentPoints.length >= 1 && mousePos && (
              <line
                x1={currentPoints[currentPoints.length - 1].x}
                y1={currentPoints[currentPoints.length - 1].y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke={drawingState.color}
                strokeWidth={drawingState.thickness}
                strokeDasharray={`${6 / scale},${4 / scale}`}
                strokeLinecap="round"
                opacity={0.7}
              />
            )}

            {/* Point markers for current drawing */}
            {drawingState && currentPoints.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={4 / scale}
                fill={drawingState.color}
                stroke="white"
                strokeWidth={1.5 / scale}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-slate-800/60 border-t border-slate-700 shrink-0 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Outil: <span className="text-slate-300 capitalize">{activeTool}</span></span>
          <span>Calque: <span className="text-slate-300">Calque par défaut</span></span>
          {isDrawing && <span className="text-blue-400">Points: {currentPoints.length}</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Roulette: zoom · Molette centrale: panoramique</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400">{Math.round(scale * 100)}%</span>
        </div>
      </div>
    </div>
  )
}
