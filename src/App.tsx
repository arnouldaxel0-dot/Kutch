import { useState, useCallback } from 'react'
import Toolbar from './components/Toolbar'
import LeftSidebar from './components/LeftSidebar'
import MainCanvas from './components/MainCanvas'
import RightSidebar from './components/RightSidebar'
import StartupMenu from './components/StartupMenu'
import AllPlansModal from './components/AllPlansModal'
import PerimeterModal from './components/PerimeterModal'
import type { Project } from './components/StartupMenu'
import type { Plan, PerimeterGroup, PerimeterPath } from './types'

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

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(400, Math.max(10, prev + delta)))
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

  // Called when user confirms perimeter modal (create new group or use existing)
  const handlePerimeterConfirm = useCallback((
    data: Omit<PerimeterGroup, 'id' | 'paths' | 'totalLength'> & { existingGroupId?: string }
  ) => {
    let groupId: string

    if (data.existingGroupId) {
      // Use existing group
      groupId = data.existingGroupId
    } else {
      // Create new group
      groupId = crypto.randomUUID()
      const newGroup: PerimeterGroup = {
        id: groupId,
        name: data.name,
        color: data.color,
        thickness: data.thickness,
        height: data.height,
        width: data.width,
        paths: [],
        totalLength: 0,
      }
      setPerimeterGroups(prev => [...prev, newGroup])
    }

    // Enter drawing mode
    const group = data.existingGroupId
      ? perimeterGroups.find(g => g.id === data.existingGroupId)
      : { color: data.color, thickness: data.thickness }

    setDrawingState({
      groupId,
      color: group?.color ?? data.color,
      thickness: group?.thickness ?? data.thickness,
    })
    setShowPerimeterModal(false)
    setActiveTool('perimetre')
  }, [perimeterGroups])

  // Enter drawing mode for existing group directly (from dropdown)
  const handleStartDrawingForGroup = useCallback((group: PerimeterGroup) => {
    setDrawingState({
      groupId: group.id,
      color: group.color,
      thickness: group.thickness,
    })
    setActiveTool('perimetre')
  }, [])

  // Called when a path is finished in the canvas
  const handlePathFinished = useCallback((groupId: string, path: PerimeterPath) => {
    setPerimeterGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g
        const updatedPaths = [...g.paths, path]
        const totalLength = updatedPaths.reduce((sum, p) => sum + p.length, 0)
        return { ...g, paths: updatedPaths, totalLength }
      })
    )
    // Keep drawing state so user can add more paths to same group
  }, [])

  const handleCancelDrawing = useCallback(() => {
    setDrawingState(null)
    setActiveTool('pointer')
  }, [])

  // When perimetre tool button clicked
  const handlePerimetreToolClick = () => {
    setShowPerimeterModal(true)
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
        onPerimetreClick={handlePerimetreToolClick}
        onStartDrawingForGroup={handleStartDrawingForGroup}
        perimeterGroups={perimeterGroups}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar activeLayer={activeLayer} />
        <MainCanvas
          activeTool={activeTool}
          zoom={zoom}
          activePlan={activePlan}
          projectName={project.name}
          drawingState={drawingState}
          onPathFinished={handlePathFinished}
          onCancelDrawing={handleCancelDrawing}
          perimeterGroups={perimeterGroups}
        />
        <RightSidebar
          plans={plans}
          activePlanId={activePlanId}
          onSelectPlan={p => setActivePlanId(p.id)}
          onOpenAllPlans={() => setShowAllPlans(true)}
          perimeterGroups={perimeterGroups}
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
    </div>
  )
}

export default App
