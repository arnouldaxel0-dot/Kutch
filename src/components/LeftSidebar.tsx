import { useRef, useState, useEffect } from 'react'
import Panel from './ui/Panel'
import NavigationPanel from './panels/NavigationPanel'
import PropertiesPanel from './panels/PropertiesPanel'
import LayersPanel from './panels/LayersPanel'
import type { Plan, PerimeterGroup, SelectedElement, CounterGroup } from '../types'
import type { Calibration } from '../App'

interface LeftSidebarProps {
  activeLayer: string
  selectedElement: SelectedElement | null
  perimeterGroups: PerimeterGroup[]
  counterGroups: CounterGroup[]
  activePlan: Plan | null
  calibration: Calibration | null
}

export default function LeftSidebar({ activeLayer: _activeLayer, selectedElement, perimeterGroups, counterGroups: _counterGroups, activePlan, calibration }: LeftSidebarProps) {
  const [width, setWidth] = useState(224)
  const [calquesHeight, setCalquesHeight] = useState(120)
  const isResizingWidth = useRef(false)
  const isResizingCalques = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const startWidth = useRef(0)
  const startHeight = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isResizingWidth.current) {
        const delta = e.clientX - startX.current
        setWidth(Math.max(160, Math.min(400, startWidth.current + delta)))
      }
      if (isResizingCalques.current) {
        const delta = startY.current - e.clientY
        setCalquesHeight(Math.max(60, Math.min(300, startHeight.current + delta)))
      }
    }
    const onUp = () => {
      isResizingWidth.current = false
      isResizingCalques.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div className="flex shrink-0 border-r border-slate-700 bg-slate-900 overflow-hidden relative" style={{ width }}>
      <div className="flex flex-col w-full overflow-hidden">
        <Panel title="Navigation" className="shrink-0">
          <NavigationPanel />
        </Panel>

        <Panel title="Propriétés" className="flex-1 overflow-hidden">
          <PropertiesPanel
            selectedElement={selectedElement}
            perimeterGroups={perimeterGroups}
            activePlan={activePlan}
            calibration={calibration}
          />
        </Panel>

        {/* Calques height resize handle */}
        <div
          className="h-1 bg-slate-700 hover:bg-indigo-500 cursor-row-resize flex items-center justify-center shrink-0 transition-colors group"
          onMouseDown={e => {
            e.preventDefault()
            isResizingCalques.current = true
            startY.current = e.clientY
            startHeight.current = calquesHeight
            document.body.style.cursor = 'row-resize'
            document.body.style.userSelect = 'none'
          }}
        >
          <span className="text-slate-600 group-hover:text-indigo-300 text-[8px] leading-none">···</span>
        </div>

        <Panel title="Calques" className="shrink-0 overflow-hidden" style={{ height: calquesHeight }}>
          <LayersPanel />
        </Panel>
      </div>

      {/* Width resize handle — right edge */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 transition-colors group flex items-center justify-center z-10"
        onMouseDown={e => {
          e.preventDefault()
          isResizingWidth.current = true
          startX.current = e.clientX
          startWidth.current = width
          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
        }}
      >
        <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-indigo-400 rounded-full transition-colors" />
      </div>
    </div>
  )
}
