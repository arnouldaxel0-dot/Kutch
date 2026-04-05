import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Toolbar from './components/Toolbar'
import LeftSidebar from './components/LeftSidebar'
import MainCanvas from './components/MainCanvas'
import RightSidebar from './components/RightSidebar'
import StartupMenu from './components/StartupMenu'
import AllPlansModal from './components/AllPlansModal'
import PerimeterModal from './components/PerimeterModal'
import CalibrationModal from './components/CalibrationModal'
import type { Project } from './components/StartupMenu'
import type { Plan, PerimeterGroup, PerimeterPath, SelectedElement } from './types'

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

interface DrawingState {
  groupId: string
  color: string
  thickness: number
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
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [pendingCalibPixels, setPendingCalibPixels] = useState<number | null>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(500, Math.max(10, prev + delta)))
  }

  const handleCreateProject = (name: string) => {
    setProject({
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      plansCount: 0,
    })
  }

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
        id: groupId, name: data.name, color: data.color, thickness: data.thickness,
        height: data.height, width: data.width, paths: [], totalLength: 0,
      }])
    }
    const group = data.existingGroupId
      ? perimeterGroups.find(g => g.id === data.existingGroupId)
      : { color: data.color, thickness: data.thickness }
    setDrawingState({ groupId, color: group?.color ?? data.color, thickness: group?.thickness ?? data.thickness })
    setShowPerimeterModal(false)
    setActiveTool('perimetre')
  }, [perimeterGroups])

  const handleStartDrawingForGroup = useCallback((group: PerimeterGroup) => {
    setDrawingState({ groupId: group.id, color: group.color, thickness: group.thickness })
    setActiveTool('perimetre')
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

  const handleExportExcel = () => {
    const rows = perimeterGroups.map(g => ({
      Nom: g.name,
      Couleur: g.color,
      Longueur: calibration
        ? `${(g.totalLength / calibration.pixelsPerUnit).toFixed(2)} ${calibration.unit}`
        : `${Math.round(g.totalLength)} px`,
      Epaisseur: g.thickness,
      Hauteur: g.height !== undefined ? `${g.height} m` : '',
      Largeur: g.width !== undefined ? `${g.width} m` : '',
      'Nb traces': g.paths.length,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Groupes')
    XLSX.writeFile(wb, `kutch-export-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (!project) {
    return (
      <StartupMenu
        onCreateProject={handleCreateProject}
        onOpenProject={setProject}
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
        onStartDrawingForGroup={handleStartDrawingForGroup}
        perimeterGroups={perimeterGroups}
        calibrationMode={calibrationMode}
        onCalibrateClick={handleCalibrateClick}
        onExportExcel={handleExportExcel}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          activeLayer={activeLayer}
          selectedElement={selectedElement}
          perimeterGroups={perimeterGroups}
          activePlan={activePlan}
          calibration={calibration}
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
        />
        <RightSidebar
          plans={plans}
          activePlanId={activePlanId}
          onSelectPlan={p => setActivePlanId(p.id)}
          onOpenAllPlans={() => setShowAllPlans(true)}
          perimeterGroups={perimeterGroups}
          calibration={calibration}
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
          onConfirm={handlePerimeterConfirm}
          onClose={() => setShowPerimeterModal(false)}
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
