import { useState, useCallback, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { saveProjectFile, loadProjectFile, autoSaveToStorage, getAutoSave } from './utils/projectFile'
import Toolbar from './components/Toolbar'
import LeftSidebar from './components/LeftSidebar'
import MainCanvas from './components/MainCanvas'
import RightSidebar from './components/RightSidebar'
import StartupMenu from './components/StartupMenu'
import AllPlansModal from './components/AllPlansModal'
import PerimeterModal from './components/PerimeterModal'
import CounterModal from './components/CounterModal'
import CalibrationModal from './components/CalibrationModal'
import type { Project } from './components/StartupMenu'
import type { Plan, PerimeterGroup, PerimeterPath, Point, SelectedElement, CounterGroup } from './types'

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
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save to localStorage 2s after any state change
  useEffect(() => {
    if (!project) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      autoSaveToStorage(project, plans, perimeterGroups, counterGroups, calibration, activePlanId)
    }, 2000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [project, plans, perimeterGroups, counterGroups, calibration, activePlanId])

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

  const handleSaveProject = async () => {
    if (!project || isSaving) return
    setIsSaving(true)
    try {
      await saveProjectFile(project, plans, perimeterGroups, counterGroups, calibration, activePlanId)
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
    } catch {
      alert('Impossible de lire ce fichier .kutch')
    }
  }

  const handleResumeAutoSave = () => {
    const saved = getAutoSave()
    if (!saved) return
    setProject(saved.project)
    setPlans(saved.plans.map(p => ({ id: p.id, name: p.name, importedAt: p.importedAt })))
    setPerimeterGroups(saved.perimeterGroups)
    setCounterGroups(saved.counterGroups)
    setCalibration(saved.calibration)
    setActivePlanId(saved.activePlanId)
    setSelectedElement(null)
    setDrawingState(null)
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
    }
    input.click()
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
      <StartupMenu
        onCreateProject={handleCreateProject}
        onOpenProject={setProject}
        onLoadProjectFile={handleLoadProjectFile}
        onResumeAutoSave={handleResumeAutoSave}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
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
        onSaveProject={handleSaveProject}
        isSaving={isSaving}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          activeLayer={activeLayer}
          selectedElement={selectedElement}
          perimeterGroups={perimeterGroups}
          counterGroups={counterGroups}
          activePlan={activePlan}
          calibration={calibration}
          onUpdateGroup={handleUpdateGroup}
        />
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
        />
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
      {pendingCalibPixels !== null && (
        <CalibrationModal
          pixelLength={pendingCalibPixels}
          onConfirm={handleCalibrationConfirm}
          onCancel={() => setPendingCalibPixels(null)}
        />
      )}
    </div>
  )
}

export default App
