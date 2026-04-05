import { useState } from 'react'
import Toolbar from './components/Toolbar'
import LeftSidebar from './components/LeftSidebar'
import MainCanvas from './components/MainCanvas'
import RightSidebar from './components/RightSidebar'
import StartupMenu from './components/StartupMenu'
import AllPlansModal from './components/AllPlansModal'
import type { Project } from './components/StartupMenu'
import type { Plan } from './components/AllPlansModal'

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

function App() {
  const [project, setProject] = useState<Project | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('pointer')
  const [scale, setScale] = useState('1:100')
  const [zoom, setZoom] = useState(100)
  const [activeLayer] = useState('Calque par défaut')
  const [plans, setPlans] = useState<Plan[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [showAllPlans, setShowAllPlans] = useState(false)

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
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar activeLayer={activeLayer} />
        <MainCanvas
          activeTool={activeTool}
          zoom={zoom}
          activePlan={activePlan?.name ?? null}
          projectName={project.name}
        />
        <RightSidebar
          plans={plans}
          activePlanId={activePlanId}
          onSelectPlan={p => setActivePlanId(p.id)}
          onOpenAllPlans={() => setShowAllPlans(true)}
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
    </div>
  )
}

export default App
