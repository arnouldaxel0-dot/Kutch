import { useState, useCallback, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { saveProjectFile, loadProjectFile, autoSaveToStorage, getAutoSave } from './utils/projectFile'
import { savePdfToIDB, loadPdfFromIDB } from './utils/pdfStorage'
import Toolbar from './components/Toolbar'
import LeftSidebar from './components/LeftSidebar'
import MainCanvas from './components/MainCanvas'
import RightSidebar from './components/RightSidebar'
import StartupMenu from './components/StartupMenu'
import AllPlansModal from './components/AllPlansModal'
import PerimeterModal from './components/PerimeterModal'
import CounterModal from './components/CounterModal'
import CalibrationModal from './components/CalibrationModal'
import ZoneModal from './components/ZoneModal'
import ZoneLabelModal from './components/ZoneLabelModal'
import type { Project } from './components/StartupMenu'
import type { Plan, PerimeterGroup, PerimeterPath, Point, SelectedElement, CounterGroup, AnnotationZone, Note } from './types'

export type Tool =
  | 'pointer'
  | 'cadrage'
  | 'surface'
  | 'perimetre'
  | 'distance'
  | 'compteur'
  | 'angle'
  | 'marquer'
  | 'note'

export interface DrawingState {
  groupId: string
  color: string
  thickness: number
  toolType: 'perimeter' | 'surface' | 'distance'
}

export interface Calibration {
  pixelsPerUnit: number
  unit: string
}

function App() {
  const [project, setProject] = useState<Project | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('pointer')
  const [scale, setScale] = useState('1:100')
  const [zoom, setZoom] = useState(100)
  const [activeLayer] = useState('Calque par défaut')
  const [plans, setPlans] = useState<Plan[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [showAllPlans, setShowAllPlans] = useState(false)
  const [perimeterGroups, setPerimeterGroups] = useState<PerimeterGroup[]>([])
  const [showPerimeterModal, setShowPerimeterModal] = useState(false)
  const [showSurfaceModal, setShowSurfaceModal] = useState(false)
  const [showDistanceModal, setShowDistanceModal] = useState(false)
  const [showCounterModal, setShowCounterModal] = useState(false)
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [pendingCalibPixels, setPendingCalibPixels] = useState<number | null>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [counterGroups, setCounterGroups] = useState<CounterGroup[]>([])
  const [activeCounterGroupId, setActiveCounterGroupId] = useState<string | null>(null)
  const [counterDrawingMode, setCounterDrawingMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveAsModal, setShowSaveAsModal] = useState(false)
  const [zones, setZones] = useState<AnnotationZone[]>([])
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [pendingZone, setPendingZone] = useState<{ points: Point[]; color: string; opacity: number } | null>(null)
  const [zoneDrawingData, setZoneDrawingData] = useState<{ color: string; opacity: number } | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save to localStorage 2s after any state change
  useEffect(() => {
    if (!project) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      autoSaveToStorage(project, plans, perimeterGroups, counterGroups, calibration, activePlanId, zones, notes)
    }, 2000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [project, plans, perimeterGroups, counterGroups, calibration, activePlanId, zones, notes])

  // Ctrl+S → save project file
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveProject()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(2000, Math.max(10, prev + delta)))
  }

  const handleCreateProject = (name: string) => {
    setProject({
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      plansCount: 0,
    })
  }

  const handleSaveProject = async (customFileName?: string) => {
    if (!project || isSaving) return
    setIsSaving(true)
    try {
      await saveProjectFile(project, plans, perimeterGroups, counterGroups, calibration, activePlanId, customFileName, zones, notes)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadProjectFile = async (file: File) => {
    try {
      const { data, plans: loadedPlans } = await loadProjectFile(file)
      setProject(data.project)
      setPlans(loadedPlans)
      setPerimeterGroups(data.perimeterGroups)
      setCounterGroups(data.counterGroups)
      setCalibration(data.calibration)
      setActivePlanId(data.activePlanId)
      setSelectedElement(null)
      setDrawingState(null)
      setZones(data.zones ?? [])
      setNotes(data.notes ?? [])
      // Save each plan's PDF file to IDB
      loadedPlans.forEach(p => { if (p.file) savePdfToIDB(p.id, p.file) })
    } catch {
      alert('Impossible de lire ce fichier .kutch')
    }
  }

  const handleResumeAutoSave = async () => {
    const saved = getAutoSave()
    if (!saved) return
    setProject(saved.project)
    setPerimeterGroups(saved.perimeterGroups)
    setCounterGroups(saved.counterGroups)
    setCalibration(saved.calibration)
    setActivePlanId(saved.activePlanId)
    setSelectedElement(null)
    setDrawingState(null)
    setZones(saved.zones ?? [])
    setNotes(saved.notes ?? [])
    const plansWithFiles = await Promise.all(
      saved.plans.map(async p => {
        const file = await loadPdfFromIDB(p.id).catch(() => null)
        return { id: p.id, name: p.name, importedAt: p.importedAt, file: file ?? undefined }
      })
    )
    setPlans(plansWithFiles)
  }

  const handleDeleteCounterGroup = useCallback((groupId: string) => {
    setCounterGroups(prev => prev.filter(g => g.id !== groupId))
    setActiveCounterGroupId(prev => prev === groupId ? null : prev)
    if (activeCounterGroupId === groupId) setCounterDrawingMode(false)
  }, [activeCounterGroupId])

  const handleImportPdf = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return
      const newPlans: Plan[] = Array.from(files).map(file => ({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.pdf$/i, ''),
        importedAt: new Date().toLocaleDateString('fr-FR'),
        file,
      }))
      setPlans(prev => {
        const updated = [...prev, ...newPlans]
        if (!activePlanId) setActivePlanId(updated[0].id)
        return updated
      })
      // Save each new plan's file to IndexedDB
      newPlans.forEach(p => { if (p.file) savePdfToIDB(p.id, p.file) })
    }
    input.click()
  }

  const handleOpenProjectFileFromMenu = () => {
    fileInputRef.current?.click()
  }

  const activePlan = plans.find(p => p.id === activePlanId) ?? null

  const handlePerimeterConfirm = useCallback((
    data: Omit<PerimeterGroup, 'id' | 'paths' | 'totalLength'> & { existingGroupId?: string }
  ) => {
    let groupId: string
    if (data.existingGroupId) {
      groupId = data.existingGroupId
    } else {
      groupId = crypto.randomUUID()
      setPerimeterGroups(prev => [...prev, {
        id: groupId,
        name: data.name,
        type: data.type,
        color: data.color,
        thickness: data.thickness,
        height: data.height,
        width: data.width,
        elementThickness: data.elementThickness,
        articleCCTP: data.articleCCTP,
        deduction: data.deduction,
        paths: [],
        totalLength: 0,
      }])
    }
    const group = data.existingGroupId
      ? perimeterGroups.find(g => g.id === data.existingGroupId)
      : { color: data.color, thickness: data.thickness }
    setDrawingState({
      groupId,
      color: group?.color ?? data.color,
      thickness: group?.thickness ?? data.thickness,
      toolType: data.type,
    })
    setShowPerimeterModal(false)
    setShowSurfaceModal(false)
    setShowDistanceModal(false)
    if (data.type === 'surface') setActiveTool('surface')
    else if (data.type === 'distance') setActiveTool('distance')
    else setActiveTool('perimetre')
  }, [perimeterGroups])

  const handleStartDrawingForGroup = useCallback((group: PerimeterGroup) => {
    setDrawingState({
      groupId: group.id,
      color: group.color,
      thickness: group.thickness,
      toolType: group.type,
    })
    if (group.type === 'surface') setActiveTool('surface')
    else if (group.type === 'distance') setActiveTool('distance')
    else setActiveTool('perimetre')
  }, [])

  const handlePathFinished = useCallback((groupId: string, path: PerimeterPath) => {
    setPerimeterGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      const updatedPaths = [...g.paths, path]
      return { ...g, paths: updatedPaths, totalLength: updatedPaths.reduce((s, p) => s + p.length, 0) }
    }))
  }, [])

  const handleCancelDrawing = useCallback(() => {
    setDrawingState(null)
    setActiveTool('pointer')
  }, [])

  const handleCalibrateClick = () => {
    setCalibrationMode(true)
    setDrawingState(null)
  }

  const handleCalibrationLine = useCallback((pixelLength: number) => {
    setPendingCalibPixels(pixelLength)
    setCalibrationMode(false)
  }, [])

  const handleCalibrationConfirm = (pixelsPerUnit: number, unit: string) => {
    setCalibration({ pixelsPerUnit, unit })
    setPendingCalibPixels(null)
  }

  const handleCancelCalibration = useCallback(() => {
    setCalibrationMode(false)
    setPendingCalibPixels(null)
  }, [])

  const handleCounterConfirm = useCallback((data: { name: string; color: string; existingGroupId?: string }) => {
    let groupId: string
    if (data.existingGroupId) {
      groupId = data.existingGroupId
    } else {
      groupId = crypto.randomUUID()
      setCounterGroups(prev => [...prev, {
        id: groupId,
        name: data.name,
        color: data.color,
        markers: [],
      }])
    }
    setActiveCounterGroupId(groupId)
    setCounterDrawingMode(true)
    setShowCounterModal(false)
    setActiveTool('compteur')
  }, [])

  const handleStartCounterForGroup = useCallback((group: CounterGroup) => {
    setActiveCounterGroupId(group.id)
    setCounterDrawingMode(true)
    setActiveTool('compteur')
  }, [])

  const handleUpdateGroup = useCallback((groupId: string, updates: Partial<PerimeterGroup>) => {
    setPerimeterGroups(prev => prev.map(g => g.id !== groupId ? g : { ...g, ...updates }))
  }, [])

  const handleDeletePath = useCallback((groupId: string, pathId: string) => {
    setPerimeterGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      const updated = g.paths.filter(p => p.id !== pathId)
      return { ...g, paths: updated, totalLength: updated.reduce((s, p) => s + p.length, 0) }
    }))
    setSelectedElement(prev => (prev?.pathId === pathId ? null : prev))
  }, [])

  const handleUpdatePath = useCallback((groupId: string, pathId: string, newPoints: Point[]) => {
    setPerimeterGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      const isSurface = g.type === 'surface'
      const updated = g.paths.map(p => {
        if (p.id !== pathId) return p
        let length: number
        if (isSurface && newPoints.length >= 3) {
          let area = 0
          for (let i = 0; i < newPoints.length - 1; i++)
            area += newPoints[i].x * newPoints[i + 1].y - newPoints[i + 1].x * newPoints[i].y
          length = Math.abs(area) / 2
        } else {
          length = newPoints.slice(1).reduce((sum, pt, i) => {
            const dx = pt.x - newPoints[i].x
            const dy = pt.y - newPoints[i].y
            return sum + Math.sqrt(dx * dx + dy * dy)
          }, 0)
        }
        return { ...p, points: newPoints, length }
      })
      return { ...g, paths: updated, totalLength: updated.reduce((s, p) => s + p.length, 0) }
    }))
  }, [])

  const handleExitCounterMode = useCallback(() => {
    setCounterDrawingMode(false)
    setActiveCounterGroupId(null)
    setActiveTool('pointer')
  }, [])

  const handleUpdateZone = useCallback((id: string, newPoints: Point[]) => {
    setZones(prev => prev.map(z => z.id !== id ? z : { ...z, points: newPoints }))
  }, [])

  const handleDeleteZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id))
  }, [])

  // Zone handlers
  const handleZoneConfirm = useCallback((color: string, opacity: number) => {
    setZoneDrawingData({ color, opacity })
    setActiveTool('marquer')
    setShowZoneModal(false)
  }, [])

  const handleZoneFinished = useCallback((points: Point[], color: string, opacity: number) => {
    setPendingZone({ points, color, opacity })
  }, [])

  const handleZoneLabelConfirm = useCallback((text: string) => {
    if (!pendingZone) return
    const newZone: AnnotationZone = {
      id: crypto.randomUUID(),
      color: pendingZone.color,
      opacity: pendingZone.opacity,
      text: text || undefined,
      points: pendingZone.points,
    }
    setZones(prev => [...prev, newZone])
    setPendingZone(null)
    setZoneDrawingData(null)
    setActiveTool('pointer')
  }, [pendingZone])

  // Note handlers
  const handlePlaceNote = useCallback((point: Point) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      text: '',
      x: point.x,
      y: point.y,
      width: 160,
      height: 120,
      color: '#fef08a',
    }
    setNotes(prev => [...prev, newNote])
    setActiveTool('pointer')
  }, [])

  const handleUpdateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id !== id ? n : { ...n, ...updates }))
  }, [])

  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }, [])

  const handlePrint = () => window.print()

  const formatLength = (px: number) => {
    if (calibration) return `${(px / calibration.pixelsPerUnit).toFixed(2)} ${calibration.unit}`
    return `${Math.round(px)} px`
  }

  const formatArea = (px2: number) => {
    if (calibration) {
      const area = px2 / (calibration.pixelsPerUnit * calibration.pixelsPerUnit)
      return `${area.toFixed(2)} ${calibration.unit}²`
    }
    return `${Math.round(px2)} px²`
  }

  const handleExportExcel = () => {
    const rows = perimeterGroups.map(g => {
      const isSurface = g.type === 'surface'

      // Surface: area; perimeter: total length
      let surfaceVal = ''
      if (isSurface) {
        surfaceVal = formatArea(g.totalLength)
      } else if (g.width !== undefined && calibration) {
        const lengthM = g.totalLength / calibration.pixelsPerUnit
        surfaceVal = `${(lengthM * g.width).toFixed(2)} m²`
      }

      // Volume = surface × elementThickness if available
      let volumeVal = ''
      if (g.elementThickness !== undefined) {
        if (isSurface && calibration) {
          const areaM2 = g.totalLength / (calibration.pixelsPerUnit * calibration.pixelsPerUnit)
          volumeVal = `${(areaM2 * g.elementThickness).toFixed(3)} m³`
        } else if (!isSurface && g.width !== undefined && calibration) {
          const lengthM = g.totalLength / calibration.pixelsPerUnit
          const area = lengthM * g.width
          volumeVal = `${(area * g.elementThickness).toFixed(3)} m³`
        }
      }

      return {
        'Article CCTP': g.articleCCTP ?? '',
        'Désignation': g.name,
        'Quantité': '',
        'Longueur': isSurface ? '' : formatLength(g.totalLength),
        'Largeur': g.width !== undefined ? `${g.width} m` : '',
        'Hauteur': g.height !== undefined ? `${g.height} m` : '',
        'Épaisseur': g.elementThickness !== undefined ? `${g.elementThickness} m` : '',
        'Surface': surfaceVal,
        'Volume': volumeVal,
        'Déduction': g.deduction ?? '',
      }
    })

    // Add counter groups at the bottom of the main sheet
    const counterRows = counterGroups.map(g => ({
      'Article CCTP': '',
      'Désignation': `[Compteur] ${g.name}`,
      'Quantité': g.markers.length,
      'Longueur': '',
      'Largeur': '',
      'Hauteur': '',
      'Épaisseur': '',
      'Surface': '',
      'Volume': '',
      'Déduction': '',
    }))
    const allRows = [...rows, ...counterRows]

    const ws = XLSX.utils.json_to_sheet(allRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Groupes')

    // Second sheet: counter details (without Couleur)
    if (counterGroups.length > 0) {
      const counterDetailRows = counterGroups.map(g => ({
        'Nom': g.name,
        'Quantité': g.markers.length,
      }))
      const wsCounters = XLSX.utils.json_to_sheet(counterDetailRows)
      XLSX.utils.book_append_sheet(wb, wsCounters, 'Compteurs')
    }

    XLSX.writeFile(wb, `kutch-export-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (!project) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept=".kutch,application/json"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleLoadProjectFile(f) }}
        />
        <StartupMenu
          onCreateProject={handleCreateProject}
          onOpenProject={setProject}
          onLoadProjectFile={handleLoadProjectFile}
          onResumeAutoSave={handleResumeAutoSave}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Hidden file input for opening project from K menu */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kutch,application/json"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleLoadProjectFile(f) }}
      />
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        scale={scale}
        setScale={setScale}
        zoom={zoom}
        onZoomIn={() => handleZoom(10)}
        onZoomOut={() => handleZoom(-10)}
        onZoomFit={() => setZoom(100)}
        onImportPdf={handleImportPdf}
        onPerimetreClick={() => setShowPerimeterModal(true)}
        onSurfaceClick={() => setShowSurfaceModal(true)}
        onDistanceClick={() => setShowDistanceModal(true)}
        onCounterClick={() => setShowCounterModal(true)}
        onStartDrawingForGroup={handleStartDrawingForGroup}
        onStartCounterForGroup={handleStartCounterForGroup}
        perimeterGroups={perimeterGroups}
        counterGroups={counterGroups}
        calibrationMode={calibrationMode}
        onCalibrateClick={handleCalibrateClick}
        onExportExcel={handleExportExcel}
        onSaveProject={() => handleSaveProject()}
        onSaveAs={() => setShowSaveAsModal(true)}
        isSaving={isSaving}
        onGoHome={() => setProject(null)}
        onOpenProjectFile={handleOpenProjectFileFromMenu}
        onZoneClick={() => setShowZoneModal(true)}
        onPrint={handlePrint}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="no-print flex">
          <LeftSidebar
            activeLayer={activeLayer}
            selectedElement={selectedElement}
            perimeterGroups={perimeterGroups}
            counterGroups={counterGroups}
            activePlan={activePlan}
            calibration={calibration}
            onUpdateGroup={handleUpdateGroup}
          />
        </div>
        <MainCanvas
          activeTool={activeTool}
          zoom={zoom}
          activePlan={activePlan}
          projectName={project.name}
          drawingState={drawingState}
          onPathFinished={handlePathFinished}
          onCancelDrawing={handleCancelDrawing}
          perimeterGroups={perimeterGroups}
          calibrationMode={calibrationMode}
          onCalibrationLine={handleCalibrationLine}
          onCancelCalibration={handleCancelCalibration}
          onSelectElement={setSelectedElement}
          selectedElement={selectedElement}
          counterGroups={counterGroups}
          activeCounterGroupId={activeCounterGroupId}
          counterDrawingMode={counterDrawingMode}
          onCounterGroupsChange={setCounterGroups}
          onExitCounterMode={handleExitCounterMode}
          onDeletePath={handleDeletePath}
          onUpdatePath={handleUpdatePath}
          calibration={calibration}
          zones={zones}
          onZoneFinished={handleZoneFinished}
          onUpdateZone={handleUpdateZone}
          onDeleteZone={handleDeleteZone}
          zoneDrawingData={zoneDrawingData}
          notes={notes}
          onPlaceNote={handlePlaceNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
        <div className="no-print flex">
          <RightSidebar
            plans={plans}
            activePlanId={activePlanId}
            onSelectPlan={p => setActivePlanId(p.id)}
            onOpenAllPlans={() => setShowAllPlans(true)}
            perimeterGroups={perimeterGroups}
            counterGroups={counterGroups}
            calibration={calibration}
            onDeleteCounterGroup={handleDeleteCounterGroup}
          />
        </div>
      </div>

      {showAllPlans && (
        <AllPlansModal
          projectName={project.name}
          plans={plans}
          activePlanId={activePlanId}
          onSelectPlan={p => setActivePlanId(p.id)}
          onClose={() => setShowAllPlans(false)}
          onImportPdf={handleImportPdf}
        />
      )}
      {showPerimeterModal && (
        <PerimeterModal
          groups={perimeterGroups}
          toolType="perimeter"
          onConfirm={handlePerimeterConfirm}
          onClose={() => setShowPerimeterModal(false)}
        />
      )}
      {showSurfaceModal && (
        <PerimeterModal
          groups={perimeterGroups}
          toolType="surface"
          onConfirm={handlePerimeterConfirm}
          onClose={() => setShowSurfaceModal(false)}
        />
      )}
      {showDistanceModal && (
        <PerimeterModal
          groups={perimeterGroups}
          toolType="distance"
          onConfirm={handlePerimeterConfirm}
          onClose={() => setShowDistanceModal(false)}
        />
      )}
      {showCounterModal && (
        <CounterModal
          groups={counterGroups}
          onConfirm={handleCounterConfirm}
          onClose={() => setShowCounterModal(false)}
        />
      )}
      {showSaveAsModal && (
        <SaveAsModal
          defaultName={project.name}
          onConfirm={name => { handleSaveProject(name); setShowSaveAsModal(false) }}
          onClose={() => setShowSaveAsModal(false)}
        />
      )}
      {pendingCalibPixels !== null && (
        <CalibrationModal
          pixelLength={pendingCalibPixels}
          onConfirm={handleCalibrationConfirm}
          onCancel={() => setPendingCalibPixels(null)}
        />
      )}
      {showZoneModal && (
        <ZoneModal onConfirm={handleZoneConfirm} onClose={() => setShowZoneModal(false)} />
      )}
      {pendingZone && (
        <ZoneLabelModal onConfirm={handleZoneLabelConfirm} onClose={() => { setPendingZone(null); setZoneDrawingData(null); setActiveTool('pointer') }} />
      )}
    </div>
  )
}

// ── Save As Modal ─────────────────────────────────────────────────────────────
function SaveAsModal({ defaultName, onConfirm, onClose }: {
  defaultName: string
  onConfirm: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(defaultName)
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-80 p-5"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Enregistrer sous…</h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()); if (e.key === 'Escape') onClose() }}
          className="w-full bg-slate-800 border border-slate-600 text-slate-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-indigo-500 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium transition-colors">Annuler</button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
