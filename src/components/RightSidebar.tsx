import { useRef, useState, useEffect } from 'react'
import Panel from './ui/Panel'
import GroupsPanel from './panels/GroupsPanel'
import RecentPlansPanel from './panels/RecentPlansPanel'
import type { Plan, PerimeterGroup, CounterGroup } from '../types'
import type { Calibration } from '../App'

interface RightSidebarProps {
  plans: Plan[]
  activePlanId: string | null
  onSelectPlan: (plan: Plan) => void
  onOpenAllPlans: () => void
  perimeterGroups: PerimeterGroup[]
  counterGroups?: CounterGroup[]
  calibration: Calibration | null
  onDeleteCounterGroup?: (groupId: string) => void
}

export default function RightSidebar({ plans, activePlanId, onSelectPlan, onOpenAllPlans, perimeterGroups, counterGroups = [], calibration, onDeleteCounterGroup }: RightSidebarProps) {
  const [width, setWidth] = useState(224)
  const [recentHeight, setRecentHeight] = useState(180)
  const isResizingWidth = useRef(false)
  const isResizingRecent = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const startWidth = useRef(0)
  const startHeight = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isResizingWidth.current) {
        const delta = startX.current - e.clientX
        setWidth(Math.max(160, Math.min(400, startWidth.current + delta)))
      }
      if (isResizingRecent.current) {
        const delta = startY.current - e.clientY
        setRecentHeight(Math.max(60, Math.min(350, startHeight.current + delta)))
      }
    }
    const onUp = () => {
      isResizingWidth.current = false
      isResizingRecent.current = false
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
    <div className="flex shrink-0 border-l border-slate-700 bg-slate-900 overflow-hidden relative" style={{ width }}>
      {/* Width resize handle — left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 transition-colors group flex items-center justify-center z-10"
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

      <div className="flex flex-col w-full overflow-hidden pl-1">
        <Panel title="Groupes" className="flex-1 overflow-hidden">
          <GroupsPanel groups={perimeterGroups} counterGroups={counterGroups} calibration={calibration} onDeleteCounterGroup={onDeleteCounterGroup} />
        </Panel>

        {/* Plans récents height resize handle */}
        <div
          className="h-1 bg-slate-700 hover:bg-indigo-500 cursor-row-resize flex items-center justify-center shrink-0 transition-colors group"
          onMouseDown={e => {
            e.preventDefault()
            isResizingRecent.current = true
            startY.current = e.clientY
            startHeight.current = recentHeight
            document.body.style.cursor = 'row-resize'
            document.body.style.userSelect = 'none'
          }}
        >
          <span className="text-slate-600 group-hover:text-indigo-300 text-[8px] leading-none">···</span>
        </div>

        <Panel title="Plans récents" className="shrink-0 overflow-hidden" contentClassName="flex flex-col" style={{ height: recentHeight }}>
          <RecentPlansPanel
            plans={plans}
            activePlanId={activePlanId}
            onSelectPlan={onSelectPlan}
            onOpenAllPlans={onOpenAllPlans}
          />
        </Panel>
      </div>
    </div>
  )
}
