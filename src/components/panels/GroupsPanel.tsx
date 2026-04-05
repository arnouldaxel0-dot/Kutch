import type { PerimeterGroup } from '../../types'

interface GroupsPanelProps {
  groups: PerimeterGroup[]
}

export default function GroupsPanel({ groups }: GroupsPanelProps) {
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
          Les groupes apparaîtront ici après avoir importé et annoté un plan.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {groups.map(group => (
        <div
          key={group.id}
          className="border-b border-slate-800 px-2 py-2"
        >
          <div className="flex items-center gap-2">
            {/* Expand arrow placeholder (static for now) */}
            <span className="text-slate-500 text-xs select-none">▼</span>
            {/* Color dot */}
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: group.color }}
            />
            {/* Name */}
            <span className="text-xs font-medium text-slate-200 truncate flex-1" title={group.name}>
              {group.name}
            </span>
            {/* Total length */}
            <span className="text-xs text-slate-400 shrink-0 font-mono">
              {Math.round(group.totalLength)} px
            </span>
          </div>
          {/* Optional height/width info */}
          {(group.height !== undefined || group.width !== undefined) && (
            <div className="flex gap-3 mt-1 ml-7 text-xs text-slate-500">
              {group.height !== undefined && (
                <span>Hauteur: {group.height} m</span>
              )}
              {group.width !== undefined && (
                <span>Largeur: {group.width} m</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
