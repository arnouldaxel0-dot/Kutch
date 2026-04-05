import { useState } from 'react'
import { X } from 'lucide-react'

interface CalibrationModalProps {
  pixelLength: number
  onConfirm: (pixelsPerUnit: number, unit: string) => void
  onCancel: () => void
}

const UNITS = ['m', 'cm', 'mm']

export default function CalibrationModal({ pixelLength, onConfirm, onCancel }: CalibrationModalProps) {
  const [realLength, setRealLength] = useState('')
  const [unit, setUnit] = useState('m')

  const handleConfirm = () => {
    const val = parseFloat(realLength)
    if (!val || val <= 0) return
    const pixelsPerUnit = pixelLength / val
    onConfirm(pixelsPerUnit, unit)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-80 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Calibration</h2>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Ligne mesurée: <span className="text-slate-200 font-mono">{Math.round(pixelLength)} px</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Longueur réelle</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.001"
                step="any"
                value={realLength}
                onChange={e => setRealLength(e.target.value)}
                placeholder="ex: 5"
                className="flex-1 bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              />
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!realLength || parseFloat(realLength) <= 0}
            className="flex-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
          >
            Calibrer
          </button>
        </div>
      </div>
    </div>
  )
}
