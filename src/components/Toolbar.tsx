import {
  MousePointer2,
  Crop,
  Square,
  Spline,
  Ruler,
  Hash,
  Compass,
  PenSquare,
  StickyNote,
  Maximize2,
  Maximize,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  RotateCcw,
  Printer,
  FileDown,
  Clipboard,
  Send,
} from 'lucide-react'
import type { Tool } from '../App'
import ToolbarButton from './ui/ToolbarButton'

interface ToolbarProps {
  activeTool: Tool
  setActiveTool: (tool: Tool) => void
  scale: string
  setScale: (scale: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
}

const SCALES = ['1:10', '1:20', '1:25', '1:50', '1:75', '1:100', '1:200', '1:500']

export default function Toolbar({
  activeTool,
  setActiveTool,
  scale,
  setScale,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}: ToolbarProps) {
  return (
    <div className="flex items-center h-10 bg-slate-800 border-b border-slate-700 px-2 gap-0.5 shrink-0 overflow-x-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 pr-2 border-r border-slate-600">
        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">K</span>
        </div>
        <span className="text-slate-300 text-sm font-semibold hidden sm:block">Kutch</span>
      </div>

      {/* Édition */}
      <ToolbarButton icon={<Clipboard size={15} />} label="Coller" />
      <ToolbarButton icon={<Send size={15} />} label="Envoyer les données" />

      <div className="toolbar-separator" />

      {/* Échelle */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-slate-500 text-xs">Échelle:</span>
        <select
          value={scale}
          onChange={e => setScale(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded px-1.5 py-0.5 h-7 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {SCALES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="toolbar-separator" />

      {/* Outils */}
      <ToolbarButton
        icon={<MousePointer2 size={15} />}
        label="Pointeur"
        active={activeTool === 'pointer'}
        onClick={() => setActiveTool('pointer')}
      />
      <ToolbarButton
        icon={<Crop size={15} />}
        label="Cadrage"
        active={activeTool === 'cadrage'}
        onClick={() => setActiveTool('cadrage')}
      />
      <ToolbarButton
        icon={<Square size={15} />}
        label="Surface"
        active={activeTool === 'surface'}
        onClick={() => setActiveTool('surface')}
      />
      <ToolbarButton
        icon={<Spline size={15} />}
        label="Périmètre"
        active={activeTool === 'perimetre'}
        onClick={() => setActiveTool('perimetre')}
      />
      <ToolbarButton
        icon={<Ruler size={15} />}
        label="Distance"
        active={activeTool === 'distance'}
        onClick={() => setActiveTool('distance')}
      />
      <ToolbarButton
        icon={<Hash size={15} />}
        label="Compteur"
        active={activeTool === 'compteur'}
        onClick={() => setActiveTool('compteur')}
      />
      <ToolbarButton
        icon={<Compass size={15} />}
        label="Angle"
        active={activeTool === 'angle'}
        onClick={() => setActiveTool('angle')}
      />

      <div className="toolbar-separator" />

      {/* Annotations */}
      <ToolbarButton
        icon={<PenSquare size={15} />}
        label="Marquer une zone"
        active={activeTool === 'marquer'}
        onClick={() => setActiveTool('marquer')}
      />
      <ToolbarButton
        icon={<StickyNote size={15} />}
        label="Insérer une note"
        active={activeTool === 'note'}
        onClick={() => setActiveTool('note')}
      />

      <div className="toolbar-separator" />

      {/* Zoom */}
      <ToolbarButton icon={<Maximize2 size={15} />} label="Ajuster à la sélection" onClick={onZoomFit} />
      <ToolbarButton icon={<Maximize size={15} />} label="Ajuster à la fenêtre" onClick={onZoomFit} />
      <ToolbarButton icon={<span className="text-xs font-bold">1:1</span>} label="Taille normale" onClick={() => onZoomFit()} />
      <ToolbarButton icon={<ZoomIn size={15} />} label="Zoom avant" onClick={onZoomIn} />
      <ToolbarButton icon={<ZoomOut size={15} />} label="Zoom arrière" onClick={onZoomOut} />

      <div className="flex items-center gap-1 px-1">
        <span className="text-slate-400 text-xs font-mono w-10 text-right">{zoom}%</span>
      </div>

      <div className="toolbar-separator" />

      {/* Parcourir */}
      <ToolbarButton icon={<ChevronLeft size={15} />} label="Plan précédent" />
      <ToolbarButton icon={<ChevronRight size={15} />} label="Plan suivant" />

      <div className="toolbar-separator" />

      {/* Ajustements */}
      <ToolbarButton icon={<Sun size={15} />} label="Luminosité / Contraste" />
      <ToolbarButton icon={<RotateCcw size={15} />} label="Retourner / Pivoter" />

      <div className="toolbar-separator" />

      {/* Imprimer / Exporter */}
      <ToolbarButton icon={<Printer size={15} />} label="Imprimer" />
      <ToolbarButton icon={<FileDown size={15} />} label="Exporter vers PDF" />
    </div>
  )
}
