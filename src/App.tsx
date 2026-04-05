import { useState } from 'react'
import Toolbar from './components/Toolbar'
import LeftSidebar from './components/LeftSidebar'
import MainCanvas from './components/MainCanvas'
import RightSidebar from './components/RightSidebar'

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

export interface AppState {
  activeTool: Tool
  scale: string
  zoom: number
  activeLayer: string
  activePlan: string
}

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('pointer')
  const [scale, setScale] = useState('1:100')
  const [zoom, setZoom] = useState(100)
  const [activeLayer] = useState('Calque par défaut')
  const [activePlan] = useState('2_ST12-PH5S1')

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(400, Math.max(10, prev + delta)))
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
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar activeLayer={activeLayer} />
        <MainCanvas
          activeTool={activeTool}
          zoom={zoom}
          activePlan={activePlan}
        />
        <RightSidebar activePlan={activePlan} />
      </div>
    </div>
  )
}

export default App
