import { useState } from 'react'
import { X } from 'lucide-react'
import type { PerimeterGroup } from '../types'

interface PerimeterModalProps {
  groups: PerimeterGroup[]
  onConfirm: (group: Omit<PerimeterGroup, 'id' | 'paths' | 'totalLength'> & { existingGroupId?: string }) => void
  onClose: () => void
}

export default function PerimeterModal({ groups, onConfirm, onClose }: PerimeterModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [thickness, setThickness] = useState(1.5)
  const [height, setHeight] = useState('')
  const [width, setWidth] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const selectExistingGroup = (group: PerimeterGroup) => {
    setSelectedGroupId(group.id)
    setName(group.name)
    setColor(group.color)
    setThickness(group.thickness)
    setHeight(group.height !== undefined ? String(group.height) : '')
    setWidth(group.width !== undefined ? String(group.width) : '')
  }

  const handleConfirm = () => {
    if (!name.trim()) return
    onConfirm({
      name: name.trim(),
      color,
      thickness,
      height: height !== '' ? parseFloat(height) : undefined,
      width: width !== '' ? parseFloat(width) : undefined,
      existingGroupId: selectedGroupId ?? undefined,
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-80 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100">Périmètre</h3>
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

          {/* Couleur + Épaisseur */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Couleur</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full h-7 rounded cursor-pointer bg-slate-800 border border-slate-600 p-0.5"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Épaisseur: {thickness}</label>
              <input
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={thickness}
                onChange={e => setThickness(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          </div>

          {/* Hauteur + Largeur */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Hauteur (m)</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="—"
                min="0"
                step="0.1"
                className="w-full bg-slate-800 border border-slate-600 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Largeur (m)</label>
              <input
                type="number"
                value={width}
                onChange={e => setWidth(e.target.value)}
                placeholder="—"
                min="0"
                step="0.1"
                className="w-full bg-slate-800 border border-slate-600 text-slate-100 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>
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
                    <span className="ml-auto text-slate-500 shrink-0">{Math.round(g.totalLength)} px</span>
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
