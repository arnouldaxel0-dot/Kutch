import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, Lock } from 'lucide-react'

interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  color: string
}

export default function LayersPanel() {
  const [layers, setLayers] = useState<Layer[]>([
    { id: '1', name: 'Calque par défaut', visible: true, locked: false, color: '#f59e0b' },
    { id: '2', name: 'Annotations', visible: true, locked: false, color: '#6366f1' },
    { id: '3', name: 'Cotes', visible: false, locked: true, color: '#10b981' },
  ])
  const [selectedLayer, setSelectedLayer] = useState('1')

  const toggleVisibility = (id: string) => {
    setLayers(prev =>
      prev.map(l => (l.id === id ? { ...l, visible: !l.visible } : l))
    )
  }

  const addLayer = () => {
    const newId = String(Date.now())
    setLayers(prev => [
      ...prev,
      {
        id: newId,
        name: `Calque ${prev.length + 1}`,
        visible: true,
        locked: false,
        color: '#64748b',
      },
    ])
  }

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return
    setLayers(prev => prev.filter(l => l.id !== id))
    if (selectedLayer === id) setSelectedLayer(layers[0]?.id ?? '')
  }

  return (
    <div className="flex flex-col bg-slate-900">
      <div className="flex-1 overflow-y-auto">
        {layers.map(layer => (
          <div
            key={layer.id}
            onClick={() => setSelectedLayer(layer.id)}
            className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer border-b border-slate-800 transition-colors ${
              selectedLayer === layer.id
                ? 'bg-slate-700'
                : 'hover:bg-slate-800'
            }`}
          >
            {/* Color dot */}
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: layer.color }}
            />
            {/* Name */}
            <span
              className={`flex-1 text-xs truncate ${
                layer.visible ? 'text-slate-200' : 'text-slate-500 line-through'
              }`}
            >
              {layer.name}
            </span>
            {/* Controls */}
            <button
              onClick={e => { e.stopPropagation(); toggleVisibility(layer.id) }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            {layer.locked && <Lock size={11} className="text-slate-600" />}
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-slate-700 bg-slate-800">
        <button
          onClick={addLayer}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700"
        >
          <Plus size={12} />
          Ajouter
        </button>
        <button
          onClick={() => removeLayer(selectedLayer)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700 ml-auto"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
