import { useState, useEffect, useRef } from 'react'

interface ZoneLabelModalProps {
  onConfirm: (text: string) => void
  onClose: () => void
}

export default function ZoneLabelModal({ onConfirm, onClose }: ZoneLabelModalProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-72 p-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Étiquette de zone <span className="text-slate-500 font-normal">(optionnel)</span></h3>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(text.trim()); if (e.key === 'Escape') onClose() }}
          placeholder="Ex: Séjour, Chambre 1…"
          className="w-full bg-slate-800 border border-slate-600 text-slate-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-amber-500 mb-4 placeholder:text-slate-600"
        />
        <div className="flex gap-2">
          <button onClick={() => onConfirm('')} className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium">Sans étiquette</button>
          <button onClick={() => onConfirm(text.trim())} className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium">Confirmer</button>
        </div>
      </div>
    </div>
  )
}
