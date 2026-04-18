import { useState } from 'react'
import { X } from 'lucide-react'

interface ZoneModalProps {
  onConfirm: (color: string, opacity: number) => void
  onClose: () => void
}

export default function ZoneModal({ onConfirm, onClose }: ZoneModalProps) {
  const [color, setColor] = useState('#f59e0b')
  const [opacity, setOpacity] = useState(0.3)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-72 pointer-events-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100">Marquer une zone</h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400"><X size={14} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Couleur</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-slate-800 border border-slate-600 p-0.5" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Opacité: {Math.round(opacity * 100)}%</label>
            <input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full" />
            <div className="mt-2 h-6 rounded border border-slate-700" style={{ backgroundColor: color, opacity }} />
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-600">Annuler</button>
          <button onClick={() => onConfirm(color, opacity)} className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium">Commencer le tracé</button>
        </div>
      </div>
    </div>
  )
}
