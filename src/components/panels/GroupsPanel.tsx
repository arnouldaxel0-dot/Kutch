import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { PerimeterGroup } from '../../types'
import type { Calibration } from '../../App'

interface GroupsPanelProps {
  groups: PerimeterGroup[]
  calibration: Calibration | null
}

function formatLength(px: number, calibration: Calibration | null): string {
  if (!calibration) return `${Math.round(px)} px`
  return `${(px / calibration.pixelsPerUnit).toFixed(2)} ${calibration.unit}`
}

export default function GroupsPanel({ groups, calibration }: GroupsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 gap-3 text-center px-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed">
          Les groupes apparaîtront ici après avoir tracé un périmètre.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto flex-1 text-xs bg-slate-900">
      {groups.map(group => {
        const isOpen = expanded[group.id]
        const totalPx = group.totalLength
        const totalDisplay = formatLength(totalPx, calibration)
        const hasDetails = group.height !== undefined || group.width !== undefined || group.paths.length > 0
        return (
          <div key={group.id}>
            <button
              onClick={() => toggle(group.id)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-slate-800 text-left border-b border-slate-800"
            >
              {hasDetails
                ? (isOpen ? <ChevronDown size={11} className="text-slate-500 shrink-0" /> : <ChevronRight size={11} className="text-slate-500 shrink-0" />)
                : <span className="w-3 shrink-0" />
              }
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
              <span className="flex-1 truncate text-slate-200 font-medium">{group.name}</span>
              <span className="text-slate-400 shrink-0 tabular-nums ml-1">
                {totalDisplay}
              </span>
            </button>

            {isOpen && hasDetails && (
              <div className="pl-7 pr-2 py-1 border-b border-slate-800/50 space-y-0.5">
                {group.height !== undefined && (
                  <div className="flex justify-between text-slate-500 py-0.5">
                    <span>Hauteur</span><span>{group.height} m</span>
                  </div>
                )}
                {group.width !== undefined && (
                  <div className="flex justify-between text-slate-500 py-0.5">
                    <span>Largeur</span><span>{group.width} m</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 py-0.5">
                  <span>Tracés</span><span>{group.paths.length}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
