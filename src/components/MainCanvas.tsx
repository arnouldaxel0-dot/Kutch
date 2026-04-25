import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Trash2 } from 'lucide-react'
import type { Tool, DrawingState, Calibration } from '../App'
import type { Plan, PerimeterGroup, PerimeterPath, Point, SelectedElement, CounterGroup, CounterMarker, AnnotationZone, Note } from '../types'
import NoteWidget from './NoteWidget'

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
  onDeletePath: (groupId: string, pathId: string) => void
  onUpdatePath: (groupId: string, pathId: string, newPoints: Point[]) => void
  onUpdateGroup: (groupId: string, updates: Partial<PerimeterGroup>) => void
  calibration: Calibration | null
  zones: AnnotationZone[]
  onZoneFinished: (points: Point[], color: string, opacity: number) => void
  onUpdateZone: (id: string, newPoints: Point[]) => void
  onDeleteZone: (id: string) => void
  zoneDrawingData: { color: string; opacity: number } | null
  notes: Note[]
  onPlaceNote: (point: Point) => void
  onUpdateNote: (id: string, updates: Partial<Note>) => void
  onDeleteNote: (id: string) => void
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

const pointInPolygon = (pt: Point, poly: Point[]): boolean => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
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
  onDeletePath,
  onUpdatePath,
  onUpdateGroup,
  calibration,
  zones,
  onZoneFinished,
  onUpdateZone,
  onDeleteZone,
  zoneDrawingData,
  notes,
  onPlaceNote,
  onUpdateNote,
  onDeleteNote,
}: MainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [pdfSize, setPdfSize] = useState({ width: 800, height: 566 })
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [mousePos, setMousePos] = useState<Point | null>(null)
  const [calibPoints, setCalibPoints] = useState<Point[]>([])
  const [contextMenu, setContextMenu] = useState<{
    screenX: number; screenY: number; groupId: string; pathId: string
  } | null>(null)
  const [zoneContextMenu, setZoneContextMenu] = useState<{
    screenX: number; screenY: number; zoneId: string
  } | null>(null)
  const [draggingPoint, setDraggingPoint] = useState<{
    groupId: string; pathId: string; pointIndex: number
  } | null>(null)
  const [draggingMarker, setDraggingMarker] = useState<{
    groupId: string; markerId: string
  } | null>(null)
  const [draggingCounterLabel, setDraggingCounterLabel] = useState<{ groupId: string } | null>(null)
  const [isHoveringPoint, setIsHoveringPoint] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [draggingZoneVertex, setDraggingZoneVertex] = useState<{ zoneId: string; idx: number } | null>(null)
  const draggingZoneBodyRef = useRef<{ zoneId: string; startMouse: Point; originalPoints: Point[] } | null>(null)
  const isPanning = useRef(false)
  const lastPanPoint = useRef({ x: 0, y: 0 })
  const panRef = useRef(pan)
  const scaleRef = useRef(scale)
  const mousePosRef = useRef<Point | null>(null)

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

        const viewport = page.getViewport({ scale: 3 })
        const canvas = pdfCanvasRef.current!
        canvas.width = viewport.width
        canvas.height = viewport.height
        const displayW = viewport.width / 3
        const displayH = viewport.height / 3
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

      // Note placement mode
      if (activeTool === 'note' && !drawingState && !counterDrawingMode) {
        const pt = screenToCanvas(e.clientX, e.clientY)
        onPlaceNote(pt)
        return
      }

      // Zone drawing mode
      if (activeTool === 'marquer' && zoneDrawingData) {
        const pt = screenToCanvas(e.clientX, e.clientY)
        setCurrentPoints(prev => [...prev, pt])
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
        const newPoints = [...currentPoints, pt]
        // Distance tool: auto-finish after exactly 2 points
        if (drawingState.toolType === 'distance' && newPoints.length === 2) {
          const path: PerimeterPath = {
            id: crypto.randomUUID(),
            points: newPoints,
            length: calcLength(newPoints),
          }
          onPathFinished(drawingState.groupId, path)
          setCurrentPoints([])
          setMousePos(null)
          return
        }
        setCurrentPoints(newPoints)
        return
      }

      // Pointer/selection mode
      if (activeTool === 'pointer') {
        const pt = screenToCanvas(e.clientX, e.clientY)
        const threshold = 12 / scaleRef.current
        // Check if clicking near a counter marker → drag it
        for (const group of counterGroups) {
          for (const marker of group.markers) {
            const dx = marker.point.x - pt.x
            const dy = marker.point.y - pt.y
            if (dx * dx + dy * dy <= threshold * threshold) {
              setDraggingMarker({ groupId: group.id, markerId: marker.id })
              return
            }
          }
        }
        // Check if clicking near an existing path point → drag it
        for (const group of perimeterGroups) {
          for (const path of group.paths) {
            for (let i = 0; i < path.points.length; i++) {
              const dx = path.points[i].x - pt.x
              const dy = path.points[i].y - pt.y
              if (dx * dx + dy * dy <= threshold * threshold) {
                setDraggingPoint({ groupId: group.id, pathId: path.id, pointIndex: i })
                return
              }
            }
          }
        }
        // Check counter labels
        const labelThresh = 10 / scaleRef.current
        for (const g of perimeterGroups.filter(g => g.counterParentId && g.paths.length > 0)) {
          const path = g.paths[0]
          const lx = g.labelPos?.x ?? (path.points.reduce((s, p) => s + p.x, 0) / path.points.length)
          const ly = g.labelPos?.y ?? (path.points.reduce((s, p) => s + p.y, 0) / path.points.length)
          if ((lx - pt.x) ** 2 + (ly - pt.y) ** 2 <= labelThresh ** 2) {
            setDraggingCounterLabel({ groupId: g.id })
            return
          }
        }

        // Otherwise hit-test for selection
        const hit = findPathAtPoint(pt)
        if (hit) {
          const group = perimeterGroups.find(g => g.id === hit.groupId)
          onSelectElement({ type: (group?.type ?? 'perimeter') as 'perimeter' | 'surface' | 'distance' | 'counter', groupId: hit.groupId, pathId: hit.pathId })
          setSelectedZoneId(null)
        } else {
          onSelectElement(null)
          // Check zone vertex drag
          const zThresh = 10 / scaleRef.current
          let zoneHit = false
          for (const zone of zones) {
            for (let i = 0; i < zone.points.length; i++) {
              const dx = zone.points[i].x - pt.x
              const dy = zone.points[i].y - pt.y
              if (dx * dx + dy * dy <= zThresh * zThresh) {
                setSelectedZoneId(zone.id)
                setDraggingZoneVertex({ zoneId: zone.id, idx: i })
                zoneHit = true
                break
              }
            }
            if (zoneHit) break
          }
          // Check zone body drag
          if (!zoneHit) {
            for (const zone of [...zones].reverse()) {
              if (pointInPolygon(pt, zone.points)) {
                setSelectedZoneId(zone.id)
                draggingZoneBodyRef.current = { zoneId: zone.id, startMouse: pt, originalPoints: [...zone.points] }
                zoneHit = true
                break
              }
            }
          }
          if (!zoneHit) setSelectedZoneId(null)
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

    const pt = screenToCanvas(e.clientX, e.clientY)
    mousePosRef.current = pt

    // Drag counter marker
    if (draggingMarker) {
      onCounterGroupsChange(prev => prev.map(g => {
        if (g.id !== draggingMarker.groupId) return g
        return { ...g, markers: g.markers.map(m => m.id !== draggingMarker.markerId ? m : { ...m, point: pt }) }
      }))
      return
    }

    // Drag counter label
    if (draggingCounterLabel) {
      onUpdateGroup(draggingCounterLabel.groupId, { labelPos: pt })
      return
    }

    // Drag zone vertex
    if (draggingZoneVertex) {
      const zone = zones.find(z => z.id === draggingZoneVertex.zoneId)
      if (zone) {
        const newPoints = [...zone.points]
        newPoints[draggingZoneVertex.idx] = pt
        onUpdateZone(zone.id, newPoints)
      }
      return
    }

    // Drag zone body
    if (draggingZoneBodyRef.current) {
      const { zoneId, startMouse, originalPoints } = draggingZoneBodyRef.current
      const dx = pt.x - startMouse.x
      const dy = pt.y - startMouse.y
      onUpdateZone(zoneId, originalPoints.map(p => ({ x: p.x + dx, y: p.y + dy })))
      return
    }

    // Drag path point
    if (draggingPoint) {
      const group = perimeterGroups.find(g => g.id === draggingPoint.groupId)
      const path = group?.paths.find(p => p.id === draggingPoint.pathId)
      if (path) {
        const newPoints = [...path.points]
        newPoints[draggingPoint.pointIndex] = pt
        // Surface paths are closed (first = last) — keep them in sync
        if (group?.type === 'surface' && newPoints.length > 1) {
          if (draggingPoint.pointIndex === 0) newPoints[newPoints.length - 1] = pt
          else if (draggingPoint.pointIndex === newPoints.length - 1) newPoints[0] = pt
        }
        onUpdatePath(draggingPoint.groupId, draggingPoint.pathId, newPoints)
      }
      return
    }

    // Hover detection for grab cursor (pointer tool, not actively dragging)
    if (activeTool === 'pointer' && !drawingState && !calibrationMode && !counterDrawingMode) {
      const hThresh = 12 / scaleRef.current
      let hovering = false
      outer: for (const group of perimeterGroups) {
        for (const path of group.paths) {
          for (const p2 of path.points) {
            const dx = p2.x - pt.x
            const dy = p2.y - pt.y
            if (dx * dx + dy * dy <= hThresh * hThresh) { hovering = true; break outer }
          }
        }
      }
      if (!hovering) {
        for (const group of counterGroups) {
          for (const m of group.markers) {
            const dx = m.point.x - pt.x
            const dy = m.point.y - pt.y
            if (dx * dx + dy * dy <= hThresh * hThresh) { hovering = true; break }
          }
          if (hovering) break
        }
      }
      setIsHoveringPoint(hovering)
    } else if (isHoveringPoint) {
      setIsHoveringPoint(false)
    }

    if (drawingState || calibrationMode || (activeTool === 'marquer' && zoneDrawingData)) {
      setMousePos(pt)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1) isPanning.current = false
    if (draggingPoint) setDraggingPoint(null)
    if (draggingMarker) setDraggingMarker(null)
    if (draggingZoneVertex) setDraggingZoneVertex(null)
    if (draggingZoneBodyRef.current) draggingZoneBodyRef.current = null
    if (draggingCounterLabel) setDraggingCounterLabel(null)
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

    // Zone drawing mode: right-click finishes zone
    if (activeTool === 'marquer' && zoneDrawingData && currentPoints.length >= 3) {
      onZoneFinished(currentPoints, zoneDrawingData.color, zoneDrawingData.opacity)
      setCurrentPoints([])
      setMousePos(null)
      return
    }

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

    if (!drawingState) {
      const pt = screenToCanvas(e.clientX, e.clientY)
      const rect = containerRef.current!.getBoundingClientRect()
      // Check zone hit first
      for (const zone of [...zones].reverse()) {
        if (pointInPolygon(pt, zone.points)) {
          setSelectedZoneId(zone.id)
          setZoneContextMenu({ screenX: e.clientX - rect.left, screenY: e.clientY - rect.top, zoneId: zone.id })
          return
        }
      }
      // Show context menu on a path
      const hit = findPathAtPoint(pt)
      if (hit) {
        setContextMenu({
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
          groupId: hit.groupId,
          pathId: hit.pathId,
        })
      }
      return
    }

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null)
        setZoneContextMenu(null)
        setSelectedZoneId(null)
        if (calibrationMode) {
          setCalibPoints([])
          onCancelCalibration()
        } else if (counterDrawingMode) {
          onExitCounterMode()
        } else if (drawingState) {
          setCurrentPoints([])
          setMousePos(null)
          onCancelDrawing()
        } else if (activeTool === 'marquer') {
          setCurrentPoints([])
          setMousePos(null)
        }
        return
      }

      // Delete/Backspace key — delete selected zone or path
      if ((e.key === 'Delete' || e.key === 'Backspace') && !drawingState && !counterDrawingMode && !calibrationMode) {
        if (selectedZoneId) {
          onDeleteZone(selectedZoneId)
          setSelectedZoneId(null)
          return
        }
        if (selectedElement) {
          onDeletePath(selectedElement.groupId, selectedElement.pathId)
          return
        }
      }

      // I key — insert point on selected path's nearest segment
      if ((e.key === 'i' || e.key === 'I') && !drawingState && !counterDrawingMode && !calibrationMode) {
        const pt = mousePosRef.current
        if (!pt || !selectedElement) return
        const group = perimeterGroups.find(g => g.id === selectedElement.groupId)
        const path = group?.paths.find(p => p.id === selectedElement.pathId)
        if (!group || !path || path.points.length < 2) return

        let bestDist = Infinity
        let bestSeg = -1
        let bestPt: Point = pt

        for (let i = 0; i < path.points.length - 1; i++) {
          const a = path.points[i]
          const b = path.points[i + 1]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len2 = dx * dx + dy * dy
          if (len2 === 0) continue
          const t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2))
          const px = a.x + t * dx
          const py = a.y + t * dy
          const dist = Math.sqrt((px - pt.x) ** 2 + (py - pt.y) ** 2)
          if (dist < bestDist) { bestDist = dist; bestSeg = i; bestPt = { x: px, y: py } }
        }

        if (bestSeg >= 0) {
          const newPoints = [...path.points]
          newPoints.splice(bestSeg + 1, 0, bestPt)
          onUpdatePath(selectedElement.groupId, selectedElement.pathId, newPoints)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, drawingState, onCancelDrawing, calibrationMode, onCancelCalibration, counterDrawingMode, onExitCounterMode, selectedElement, perimeterGroups, onUpdatePath, onDeletePath, selectedZoneId, zones, onDeleteZone])

  const isDrawing = !!drawingState

  // Build SVG path string from points
  const buildPathD = (points: Point[]) => {
    if (points.length < 2) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }

  // Helper to format path measurement for context menu
  const fmtPathLength = (length: number, type: 'perimeter' | 'surface' | 'distance') => {
    if (type === 'surface') {
      if (!calibration) return `${Math.round(length)} px²`
      return `${(length / (calibration.pixelsPerUnit ** 2)).toFixed(2)} ${calibration.unit}²`
    }
    if (!calibration) return `${Math.round(length)} px`
    return `${(length / calibration.pixelsPerUnit).toFixed(2)} ${calibration.unit}`
  }

  // Determine cursor
  let cursor = 'default'
  if (draggingPoint || draggingMarker) {
    cursor = 'grabbing'
  } else if (isHoveringPoint && activeTool === 'pointer' && !drawingState) {
    cursor = 'grab'
  } else if (calibrationMode) {
    cursor = 'crosshair'
  } else if (isDrawing) {
    cursor = 'crosshair'
  } else if (activeTool === 'marquer' && zoneDrawingData) {
    cursor = 'crosshair'
  } else if (activeTool === 'note') {
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
      note: 'crosshair',
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
      {/* Calibration reminder banner */}
      {activePlan && !calibration && !calibrationMode && (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-red-600 shrink-0 animate-pulse">
          <span className="text-white text-xs font-semibold tracking-wide">
            ⚠ Échelle non calibrée — Cliquez sur le bouton <span className="font-bold underline">Calibrer</span> dans la barre d'outils pour définir l'échelle du plan
          </span>
        </div>
      )}

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

      {/* Zone drawing mode indicator */}
      {activeTool === 'marquer' && zoneDrawingData && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 bg-amber-500/90 rounded-full text-white text-xs font-medium shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: zoneDrawingData.color }} />
          Tracé de zone — Clic gauche: ajouter point · Clic droit: terminer ({currentPoints.length} pts) · Échap: annuler
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
        onMouseDown={e => { if (contextMenu) { setContextMenu(null); return } handleMouseDown(e) }}
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
              width: pdfSize.width / 3,
              height: pdfSize.height / 3,
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
              width: activePlan ? pdfSize.width / 3 : 800,
              height: activePlan ? pdfSize.height / 3 : 566,
              overflow: 'visible',
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Annotation zones (behind everything else) */}
            {zones.map(zone => {
              const isSel = zone.id === selectedZoneId
              return (
                <g key={zone.id}>
                  <polygon
                    points={zone.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={zone.color}
                    fillOpacity={zone.opacity}
                    stroke={isSel ? 'white' : zone.color}
                    strokeOpacity={isSel ? 0.9 : Math.min(1, zone.opacity + 0.2)}
                    strokeWidth={(isSel ? 2 : 1.5) / scale}
                    strokeDasharray={isSel ? `${6 / scale},${3 / scale}` : undefined}
                  />
                  {zone.text && (() => {
                    const cx = zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length
                    const cy = zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                        fill={zone.color} fontSize={13 / scale} fontWeight="600"
                        fontFamily="sans-serif" opacity={Math.min(1, zone.opacity + 0.4)}>
                        {zone.text}
                      </text>
                    )
                  })()}
                  {/* Vertex handles when selected */}
                  {isSel && zone.points.map((pt, i) => (
                    <circle
                      key={`zv-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={6 / scale}
                      fill="white"
                      stroke={zone.color}
                      strokeWidth={2 / scale}
                      style={{ cursor: 'grab' }}
                    />
                  ))}
                </g>
              )
            })}

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

            {/* Counter sub-group numbered labels */}
            {perimeterGroups
              .filter(g => g.counterParentId && g.paths.length > 0)
              .map(g => {
                const path = g.paths[0]
                const cx = g.labelPos?.x ?? (path.points.reduce((s, p) => s + p.x, 0) / path.points.length)
                const cy = g.labelPos?.y ?? (path.points.reduce((s, p) => s + p.y, 0) / path.points.length)
                const num = g.name.split(' - ').pop() ?? g.name
                const fw = (num.length * 5.5 + 12) / scale
                const fh = 15 / scale
                return (
                  <g
                    key={`lbl-${g.id}`}
                    style={{ cursor: 'move' }}
                    onMouseDown={e => {
                      e.stopPropagation()
                      setDraggingCounterLabel({ groupId: g.id })
                    }}
                  >
                    <rect x={cx - fw / 2} y={cy - fh / 2} width={fw} height={fh} rx={3 / scale} fill={g.color} fillOpacity={0.92} />
                    <text
                      x={cx} y={cy}
                      textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize={9 / scale} fontWeight="bold" fontFamily="sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {num}
                    </text>
                  </g>
                )
              })
            }

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

            {/* Zone drawing preview */}
            {activeTool === 'marquer' && zoneDrawingData && currentPoints.length >= 1 && (
              <>
                {currentPoints.length >= 2 && (
                  <polygon
                    points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={zoneDrawingData.color}
                    fillOpacity={zoneDrawingData.opacity * 0.6}
                    stroke={zoneDrawingData.color}
                    strokeOpacity={0.8}
                    strokeWidth={1.5 / scale}
                    strokeDasharray={`${6 / scale},${3 / scale}`}
                  />
                )}
                {mousePos && (
                  <line
                    x1={currentPoints[currentPoints.length - 1].x}
                    y1={currentPoints[currentPoints.length - 1].y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke={zoneDrawingData.color}
                    strokeWidth={1.5 / scale}
                    strokeDasharray={`${6 / scale},${4 / scale}`}
                    opacity={0.7}
                  />
                )}
                {currentPoints.map((pt, i) => (
                  <circle
                    key={`zone-pt-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={4 / scale}
                    fill={zoneDrawingData.color}
                    stroke="white"
                    strokeWidth={1.5 / scale}
                  />
                ))}
              </>
            )}
          </svg>
          {/* Notes — inside transformed div, auto-scales with pan/zoom */}
          {notes.map(note => (
            <NoteWidget
              key={note.id}
              note={note}
              scale={scale}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (() => {
        const grp = perimeterGroups.find(g => g.id === contextMenu.groupId)
        const pth = grp?.paths.find(p => p.id === contextMenu.pathId)
        if (!grp || !pth) return null
        return (
          <div
            className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden min-w-48"
            style={{ left: contextMenu.screenX + 4, top: contextMenu.screenY + 4 }}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Info header */}
            <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: grp.color }} />
                <span className="text-xs font-semibold text-slate-200 truncate">{grp.name}</span>
                <span className="ml-auto text-[10px] text-slate-500 shrink-0">
                  {grp.type === 'surface' ? 'Surface' : grp.type === 'distance' ? 'Distance' : 'Périmètre'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 pl-4 space-y-0.5">
                <div>{pth.points.length} points</div>
                <div>{fmtPathLength(pth.length, grp.type)}</div>
              </div>
            </div>
            {/* Actions */}
            <button
              onClick={() => {
                onDeletePath(contextMenu.groupId, contextMenu.pathId)
                setContextMenu(null)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-900/40 text-red-400 hover:text-red-300 text-xs transition-colors"
            >
              <Trash2 size={12} />
              Supprimer ce tracé
            </button>
          </div>
        )
      })()}

      {/* Zone context menu */}
      {zoneContextMenu && (
        <div
          className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden min-w-44"
          style={{ left: zoneContextMenu.screenX + 4, top: zoneContextMenu.screenY + 4 }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/60">
            <span className="text-xs font-semibold text-slate-200">Zone marquée</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Glisser pour déplacer · Poignées pour redimensionner</p>
          </div>
          <button
            onClick={() => {
              onDeleteZone(zoneContextMenu.zoneId)
              setSelectedZoneId(null)
              setZoneContextMenu(null)
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-900/40 text-red-400 hover:text-red-300 text-xs transition-colors"
          >
            <Trash2 size={12} />
            Supprimer la zone
          </button>
        </div>
      )}

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
