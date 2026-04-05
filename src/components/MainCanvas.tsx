import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { Tool, DrawingState } from '../App'
import type { Plan, PerimeterGroup, PerimeterPath, Point, SelectedElement, CounterGroup, CounterMarker } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

interface MainCanvasProps {
  activeTool: Tool
  zoom: number
  activePlan: Plan | null
  projectName?: string
  drawingState: DrawingState | null
  onPathFinished: (groupId: string, path: PerimeterPath) => void
  onCancelDrawing: () => void
  perimeterGroups: PerimeterGroup[]
  calibrationMode: boolean
  onCalibrationLine: (length: number) => void
  onCancelCalibration: () => void
  onSelectElement: (element: SelectedElement | null) => void
  selectedElement: SelectedElement | null
  counterGroups: CounterGroup[]
  activeCounterGroupId: string | null
  counterDrawingMode: boolean
  onCounterGroupsChange: (fn: (prev: CounterGroup[]) => CounterGroup[]) => void
  onExitCounterMode: () => void
}

const calcLength = (points: Point[]) =>
  points.slice(1).reduce((sum, p, i) => {
    const dx = p.x - points[i].x
    const dy = p.y - points[i].y
    return sum + Math.sqrt(dx * dx + dy * dy)
  }, 0)

const calcArea = (points: Point[]) => {
  let area = 0
  for (let i = 0; i < points.length - 1; i++) {
    area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y
  }
  return Math.abs(area) / 2
}

const nextNumber = (markers: CounterMarker[]) => {
  const used = new Set(markers.map(m => m.number))
  let n = 1
  while (used.has(n)) n++
  return n
}

export default function MainCanvas({
  activeTool,
  zoom: _zoom,
  activePlan,
  projectName,
  drawingState,
  onPathFinished,
  onCancelDrawing,
  perimeterGroups,
  calibrationMode,
  onCalibrationLine,
  onCancelCalibration,
  onSelectElement,
  selectedElement,
  counterGroups,
  activeCounterGroupId,
  counterDrawingMode,
  onCounterGroupsChange,
  onExitCounterMode,
}: MainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [pdfSize, setPdfSize] = useState({ width: 800, height: 566 })
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [mousePos, setMousePos] = useState<Point | null>(null)
  const [calibPoints, setCalibPoints] = useState<Point[]>([])
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
        const displayW = viewport.width / 2
        const displayH = viewport.height / 2
        setPdfSize({ width: viewport.width, height: viewport.height })

        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise

        // Center the PDF in the viewport and fit it
        if (!cancelled && containerRef.current) {
          const cw = containerRef.current.clientWidth
          const ch = containerRef.current.clientHeight
          const fitScale = Math.min(cw / displayW, ch / displayH) * 0.9
          const centeredX = (cw - displayW * fitScale) / 2
          const centeredY = (ch - displayH * fitScale) / 2
          setScale(fitScale)
          setPan({ x: centeredX, y: centeredY })
        }
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

  // Reset calibration points when calibration mode changes
  useEffect(() => {
    if (!calibrationMode) {
      setCalibPoints([])
    }
  }, [calibrationMode])

  // Wheel zoom with passive: false — cap at 5 (= 500%)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const prevScale = scaleRef.current
      const prevPan = panRef.current
      const newScale = Math.min(20, Math.max(0.05, prevScale * factor))
      const actualRatio = newScale / prevScale
      setPan({
        x: mouseX - (mouseX - prevPan.x) * actualRatio,
        y: mouseY - (mouseY - prevPan.y) * actualRatio,
      })
      setScale(newScale)
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

  // Hit-test: find path within 8px (in screen space) of click
  const findPathAtPoint = useCallback((canvasPt: Point): { groupId: string; pathId: string } | null => {
    const threshold = 8 / scaleRef.current
    for (const group of perimeterGroups) {
      for (const path of group.paths) {
        // Check each segment of the path
        for (let i = 0; i < path.points.length - 1; i++) {
          const a = path.points[i]
          const b = path.points[i + 1]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len2 = dx * dx + dy * dy
          if (len2 === 0) continue
          const t = Math.max(0, Math.min(1, ((canvasPt.x - a.x) * dx + (canvasPt.y - a.y) * dy) / len2))
          const px = a.x + t * dx - canvasPt.x
          const py = a.y + t * dy - canvasPt.y
          if (px * px + py * py <= threshold * threshold) {
            return { groupId: group.id, pathId: path.id }
          }
        }
        // Also check individual points
        for (const pt of path.points) {
          const dx = pt.x - canvasPt.x
          const dy = pt.y - canvasPt.y
          if (dx * dx + dy * dy <= threshold * threshold) {
            return { groupId: group.id, pathId: path.id }
          }
        }
      }
    }
    return null
  }, [perimeterGroups])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button → start pan
    if (e.button === 1) {
      e.preventDefault()
      isPanning.current = true
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
      return
    }

    // Left click
    if (e.button === 0) {
      // Calibration mode
      if (calibrationMode) {
        const pt = screenToCanvas(e.clientX, e.clientY)
        setCalibPoints(prev => {
          const next = [...prev, pt]
          if (next.length === 2) {
            const dx = next[1].x - next[0].x
            const dy = next[1].y - next[0].y
            const len = Math.sqrt(dx * dx + dy * dy)
            onCalibrationLine(len)
            return []
          }
          return next
        })
        return
      }

      // Counter placement mode
      if (counterDrawingMode && activeCounterGroupId) {
        const pt = screenToCanvas(e.clientX, e.clientY)
        onCounterGroupsChange(prev => prev.map(g => {
          if (g.id !== activeCounterGroupId) return g
          const num = nextNumber(g.markers)
          return { ...g, markers: [...g.markers, { id: crypto.randomUUID(), number: num, point: pt }] }
        }))
        return
      }

      // Drawing mode
      if (drawingState) {
        const pt = screenToCanvas(e.clientX, e.clientY)
        setCurrentPoints(prev => [...prev, pt])
        return
      }

      // Pointer/selection mode
      if (activeTool === 'pointer') {
        const pt = screenToCanvas(e.clientX, e.clientY)
        const hit = findPathAtPoint(pt)
        if (hit) {
          const group = perimeterGroups.find(g => g.id === hit.groupId)
          onSelectElement({ type: group?.type ?? 'perimeter', groupId: hit.groupId, pathId: hit.pathId })
        } else {
          onSelectElement(null)
        }
      }
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

    if (drawingState || calibrationMode) {
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

  // Find counter marker near a canvas point
  const findMarkerAtPoint = useCallback((canvasPt: Point, groupId: string): CounterMarker | null => {
    const threshold = 12 / scaleRef.current
    const group = counterGroups.find(g => g.id === groupId)
    if (!group) return null
    for (const m of group.markers) {
      const dx = m.point.x - canvasPt.x
      const dy = m.point.y - canvasPt.y
      if (dx * dx + dy * dy <= threshold * threshold) return m
    }
    return null
  }, [counterGroups])

  // Right-click → finish path (also adds mouse position as final point if only 1 point placed)
  // Also handles deleting counter markers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()

    // Counter mode: right-click on marker → delete it
    if (counterDrawingMode && activeCounterGroupId) {
      const pt = screenToCanvas(e.clientX, e.clientY)
      const marker = findMarkerAtPoint(pt, activeCounterGroupId)
      if (marker) {
        const markerId = marker.id
        onCounterGroupsChange(prev => prev.map(g => {
          if (g.id !== activeCounterGroupId) return g
          return { ...g, markers: g.markers.filter(m => m.id !== markerId) }
        }))
      }
      return
    }

    if (!drawingState) return

    // Build final points array: add current mouse pos as the last point if useful
    const finalPoints = [...currentPoints]
    const cursorPt = screenToCanvas(e.clientX, e.clientY)

    if (finalPoints.length === 0) {
      // No points at all — nothing to save
      return
    }

    if (finalPoints.length === 1) {
      finalPoints.push(cursorPt)
    }

    let pathLength: number
    if (drawingState.toolType === 'surface' && finalPoints.length >= 3) {
      // Close polygon back to origin
      finalPoints.push({ ...finalPoints[0] })
      pathLength = calcArea(finalPoints)
    } else {
      pathLength = calcLength(finalPoints)
    }

    const path: PerimeterPath = {
      id: crypto.randomUUID(),
      points: finalPoints,
      length: pathLength,
    }
    onPathFinished(drawingState.groupId, path)
    setCurrentPoints([])
    setMousePos(null)
  }

  // Escape → cancel drawing or calibration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (calibrationMode) {
          setCalibPoints([])
          onCancelCalibration()
        } else if (counterDrawingMode) {
          onExitCounterMode()
        } else if (drawingState) {
          setCurrentPoints([])
          setMousePos(null)
          onCancelDrawing()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawingState, onCancelDrawing, calibrationMode, onCancelCalibration, counterDrawingMode, onExitCounterMode])

  const isDrawing = !!drawingState

  // Build SVG path string from points
  const buildPathD = (points: Point[]) => {
    if (points.length < 2) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }

  // Determine cursor
  let cursor = 'default'
  if (calibrationMode) {
    cursor = 'crosshair'
  } else if (isDrawing) {
    cursor = 'crosshair'
  } else if (activeTool === 'pointer') {
    cursor = 'default'
  } else {
    const TOOL_CURSORS: Record<string, string> = {
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
    cursor = TOOL_CURSORS[activeTool] ?? 'default'
  }

  // Get selected path info for rendering
  const selectedGroup = selectedElement
    ? perimeterGroups.find(g => g.id === selectedElement.groupId)
    : null
  const selectedPath = selectedGroup
    ? selectedGroup.paths.find(p => p.id === selectedElement!.pathId)
    : null

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
      {isDrawing && !calibrationMode && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 bg-blue-600/90 rounded-full text-white text-xs font-medium shadow-lg pointer-events-none">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: drawingState.color }}
          />
          Mode dessin actif — Clic gauche: ajouter point · Clic droit: terminer · Échap: annuler
        </div>
      )}

      {/* Calibration mode indicator */}
      {calibrationMode && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 bg-amber-600/90 rounded-full text-white text-xs font-medium shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          {calibPoints.length === 0
            ? 'Calibration: cliquez sur le premier point'
            : 'Calibration: cliquez sur le deuxième point · Échap: annuler'}
        </div>
      )}

      {/* Canvas area with colored border when drawing/calibrating */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative ${
          calibrationMode
            ? 'ring-2 ring-amber-500 ring-inset'
            : isDrawing
            ? 'ring-2 ring-blue-500 ring-inset'
            : ''
        }`}
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
            {/* Surface fills (behind lines) */}
            {perimeterGroups.filter(g => g.type === 'surface').map(group =>
              group.paths.map(path => (
                <polygon
                  key={`fill-${path.id}`}
                  points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={group.color}
                  fillOpacity={0.15}
                  stroke="none"
                />
              ))
            )}

            {/* Existing finished paths from all groups */}
            {perimeterGroups.map(group =>
              group.paths.map(path => {
                const isSelected =
                  selectedElement?.groupId === group.id &&
                  selectedElement?.pathId === path.id
                return (
                  <g key={path.id}>
                    {isSelected && (
                      <path
                        d={buildPathD(path.points)}
                        fill="none"
                        stroke="white"
                        strokeWidth={(group.thickness + 4) / scale}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    <path
                      d={buildPathD(path.points)}
                      fill="none"
                      stroke={group.color}
                      strokeWidth={isSelected ? (group.thickness + 2) / scale : group.thickness / scale}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )
              })
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

            {/* Selection handles (larger dots at endpoints) */}
            {selectedPath && selectedGroup && (
              <>
                {selectedPath.points.map((pt, i) => (
                  <circle
                    key={`sel-handle-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={6 / scale}
                    fill={selectedGroup.color}
                    stroke="white"
                    strokeWidth={2 / scale}
                  />
                ))}
              </>
            )}

            {/* Current drawing path (+ surface fill preview) */}
            {drawingState && currentPoints.length >= 2 && (
              <>
                {drawingState.toolType === 'surface' && (
                  <polygon
                    points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={drawingState.color}
                    fillOpacity={0.1}
                    stroke="none"
                  />
                )}
                <path
                  d={buildPathD(currentPoints)}
                  fill="none"
                  stroke={drawingState.color}
                  strokeWidth={drawingState.thickness / scale}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Preview line to cursor */}
            {drawingState && currentPoints.length >= 1 && mousePos && (
              <line
                x1={currentPoints[currentPoints.length - 1].x}
                y1={currentPoints[currentPoints.length - 1].y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke={drawingState.color}
                strokeWidth={drawingState.thickness / scale}
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

            {/* Counter markers */}
            {counterGroups.map(group =>
              group.markers.map(marker => (
                <g key={marker.id}>
                  <circle
                    cx={marker.point.x}
                    cy={marker.point.y}
                    r={10 / scale}
                    fill={group.color}
                    stroke="white"
                    strokeWidth={1.5 / scale}
                  />
                  <text
                    x={marker.point.x}
                    y={marker.point.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={9 / scale}
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {marker.number}
                  </text>
                </g>
              ))
            )}

            {/* Calibration points and line */}
            {calibrationMode && calibPoints.length >= 1 && (
              <>
                {calibPoints.length === 1 && mousePos && (
                  <line
                    x1={calibPoints[0].x}
                    y1={calibPoints[0].y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke="#f59e0b"
                    strokeWidth={2 / scale}
                    strokeDasharray={`${8 / scale},${5 / scale}`}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                )}
                {calibPoints.map((pt, i) => (
                  <circle
                    key={`calib-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={5 / scale}
                    fill="#f59e0b"
                    stroke="white"
                    strokeWidth={2 / scale}
                  />
                ))}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-slate-800/60 border-t border-slate-700 shrink-0 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Outil: <span className="text-slate-300 capitalize">{calibrationMode ? 'calibration' : activeTool}</span></span>
          <span>Calque: <span className="text-slate-300">Calque par défaut</span></span>
          {isDrawing && !calibrationMode && <span className="text-blue-400">Points: {currentPoints.length}</span>}
          {calibrationMode && <span className="text-amber-400">Points calibration: {calibPoints.length}/2</span>}
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
