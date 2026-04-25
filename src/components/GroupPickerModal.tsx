import { X } from 'lucide-react'
import type { PerimeterGroup, CounterGroup } from '../types'

interface GroupPickerModalProps {
  type: 'perimeter' | 'surface' | 'distance' | 'counter'
  perimeterGroups: PerimeterGroup[]
  counterGroups: CounterGroup[]
  onSelectPerimeterGroup: (group: PerimeterGroup) => void
  onSelectCounterGroup: (group: CounterGroup) => void
  onClose: () => void
}

export default function GroupPickerModal({
  type,
  perimeterGroups,
  counterGroups,
  onSelectPerimeterGroup,
  onSelectCounterGroup,
  onClose,
}: GroupPickerModalProps) {
  const title = type === 'surface' ? 'Surface' : type === 'distance' ? 'Distance' : type === 'counter' ? 'Compteur' : 'Périmètre'
  const typeLabel = type === 'surface' ? 'S' : type === 'distance' ? 'D' : type === 'counter' ? 'C' : 'P'

  const filteredGroups = type === 'counter'
    ? []
    : perimeterGroups.filter(g => g.type === type && !g.counterParentId)
  const filteredCounters = type === 'counter' ? counterGroups : []

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-72 max-h-80 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">{typeLabel}</span>
            <h3 className="text-sm font-semibold text-slate-100">Groupes {title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {filteredGroups.length === 0 && filteredCounters.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-8">Aucun groupe existant</p>
          )}

          {/* Perimeter / Surface / Distance groups */}
          {filteredGroups.map(group => (
            <button
              key={group.id}
              onClick={() => { onSelectPerimeterGroup(group); onClose() }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-500 text-left transition-colors group"
            >
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-200 font-medium truncate block">{group.name}</span>
                {group.isCounter && (
                  <span className="text-[10px] text-amber-400/80">Numérotation automatique</span>
                )}
              </div>
              {group.isCounter && (
                <span className="shrink-0 text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-1">#</span>
              )}
              <span className="text-[10px] text-slate-500 shrink-0 group-hover:text-slate-400">
                {group.paths.length} tracé{group.paths.length !== 1 ? 's' : ''}
              </span>
            </button>
          ))}

          {/* Counter groups */}
          {filteredCounters.map(group => (
            <button
              key={group.id}
              onClick={() => { onSelectCounterGroup(group); onClose() }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-500 text-left transition-colors"
            >
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
              <span className="flex-1 text-xs text-slate-200 font-medium truncate">{group.name}</span>
              <span className="text-[10px] text-slate-500 shrink-0">{group.markers.length} pt{group.markers.length !== 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
