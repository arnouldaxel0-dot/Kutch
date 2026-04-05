import { useState } from 'react'
import { X } from 'lucide-react'
import type { CounterGroup } from '../types'

interface CounterModalProps {
  groups: CounterGroup[]
  onConfirm: (data: { name: string; color: string; existingGroupId?: string }) => void
  onClose: () => void
}

export default function CounterModal({ groups, onConfirm, onClose }: CounterModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#f59e0b')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const selectExistingGroup = (group: CounterGroup) => {
    setSelectedGroupId(group.id)
    setName(group.name)
    setColor(group.color)
  }

  const handleConfirm = () => {
    if (!name.trim()) return
    onConfirm({
      name: name.trim(),
      color,
      existingGroupId: selectedGroupId ?? undefined,
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-72 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100">Compteur</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3">
          {/* Nom */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nom <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setSelectedGroupId(null) }}
              placeholder="Nom du groupe"
              className="w-full bg-slate-800 border border-slate-600 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Couleur</label>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-full h-7 rounded cursor-pointer bg-slate-800 border border-slate-600 p-0.5"
            />
          </div>

          {/* Existing groups */}
          {groups.length > 0 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Groupes existants</label>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => selectExistingGroup(g)}
                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                      selectedGroupId === g.id
                        ? 'bg-indigo-600/30 border border-indigo-500 text-indigo-300'
                        : 'bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="truncate">{g.name}</span>
                    <span className="ml-auto text-slate-500 shrink-0">{g.markers.length} pts</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-600"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
          >
            Commencer
          </button>
        </div>
      </div>
    </div>
  )
}
