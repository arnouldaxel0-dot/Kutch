import { useState, useRef, useEffect } from 'react'
import {
  MousePointer2,
  Square,
  Spline,
  Ruler,
  Hash,
  PenSquare,
  StickyNote,
  Maximize2,
  Maximize,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Printer,
  FileDown,
  Clipboard,
  FileUp,
  FileSpreadsheet,
  Crosshair,
  Save,
  Home,
} from 'lucide-react'
import type { Tool } from '../App'
import type { PerimeterGroup, CounterGroup } from '../types'
import ToolbarButton from './ui/ToolbarButton'
import Tooltip from './ui/Tooltip'
import GroupPickerModal from './GroupPickerModal'

interface ToolbarProps {
  activeTool: Tool
  setActiveTool: (tool: Tool) => void
  scale: string
  setScale: (scale: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
  onImportPdf: () => void
  onPerimetreClick: () => void
  onSurfaceClick: () => void
  onDistanceClick: () => void
  onCounterClick: () => void
  onStartDrawingForGroup: (group: PerimeterGroup) => void
  onStartCounterForGroup: (group: CounterGroup) => void
  perimeterGroups: PerimeterGroup[]
  counterGroups: CounterGroup[]
  calibrationMode: boolean
  onCalibrateClick: () => void
  onExportExcel: () => void
  onSaveProject: () => void
  onSaveAs: () => void
  isSaving: boolean
  onGoHome: () => void
  onOpenProjectFile: () => void
  onZoneClick: () => void
  onPrint: () => void
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
  onImportPdf,
  onPerimetreClick,
  onSurfaceClick,
  onDistanceClick,
  onCounterClick,
  onStartDrawingForGroup,
  onStartCounterForGroup,
  perimeterGroups,
  counterGroups,
  calibrationMode,
  onCalibrateClick,
  onExportExcel,
  onSaveProject,
  onSaveAs,
  isSaving,
  onGoHome,
  onOpenProjectFile,
  onZoneClick,
  onPrint,
}: ToolbarProps) {
  const [showGroupPicker, setShowGroupPicker] = useState<'perimeter' | 'surface' | 'distance' | 'counter' | null>(null)
  const [showLogoMenu, setShowLogoMenu] = useState(false)
  const [logoMenuPos, setLogoMenuPos] = useState({ top: 40, left: 8 })
  const logoMenuRef = useRef<HTMLDivElement>(null)
  const logoButtonRef = useRef<HTMLButtonElement>(null)

  // Close logo menu on outside click
  useEffect(() => {
    if (!showLogoMenu) return
    const handleClick = (e: MouseEvent) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) setShowLogoMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showLogoMenu])

  return (
    <div className="no-print flex items-center h-10 bg-slate-800 border-b border-slate-700 px-2 gap-0.5 shrink-0 overflow-x-auto">
      {/* Logo menu */}
      <div className="relative flex items-center gap-2 mr-2 pr-2 border-r border-slate-600" ref={logoMenuRef}>
        <button
          ref={logoButtonRef}
          onClick={() => {
            const rect = logoButtonRef.current?.getBoundingClientRect()
            if (rect) setLogoMenuPos({ top: rect.bottom + 6, left: rect.left })
            setShowLogoMenu(v => !v)
          }}
          className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-700 transition-colors"
        >
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <span className="text-slate-300 text-sm font-semibold hidden sm:block">Kutch</span>
        </button>
        {showLogoMenu && (
          <div
            className="fixed z-[200] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl min-w-44 py-1 overflow-hidden"
            style={{ top: logoMenuPos.top, left: logoMenuPos.left }}
          >
            <button
              onClick={() => { onGoHome(); setShowLogoMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
            >
              <Home size={13} className="text-slate-400" />
              <span className="text-xs text-slate-300">Accueil</span>
            </button>
            <button
              onClick={() => { onGoHome(); setShowLogoMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
            >
              <span className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs text-slate-300">Nouveau projet</span>
            </button>
            <div className="my-1 border-t border-slate-700" />
            <button
              onClick={() => { onOpenProjectFile(); setShowLogoMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
            >
              <span className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs text-slate-300">Ouvrir un projet…</span>
            </button>
            <button
              onClick={() => { onSaveProject(); setShowLogoMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
            >
              <span className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs text-slate-300">Sauvegarder</span>
            </button>
            <button
              onClick={() => { onSaveAs(); setShowLogoMenu(false) }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
            >
              <span className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs text-slate-300">Enregistrer sous…</span>
            </button>
          </div>
        )}
      </div>

      {/* Import PDF */}
      <Tooltip text="Importer un PDF" position="bottom">
        <button
          onClick={onImportPdf}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shrink-0"
        >
          <FileUp size={13} />
          <span>Importer PDF</span>
        </button>
      </Tooltip>

      {/* Save split button */}
      <div className="flex items-center shrink-0">
        <Tooltip text="Sauvegarder (Ctrl+S)" position="bottom">
          <button
            onClick={onSaveProject}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-2 h-7 rounded-l bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-xs font-medium transition-colors border border-slate-600 border-r-0"
          >
            <Save size={13} />
            <span className="hidden sm:block">{isSaving ? '...' : 'Sauvegarder'}</span>
          </button>
        </Tooltip>
        <Tooltip text="Enregistrer sous…" position="bottom">
          <button
            onClick={onSaveAs}
            disabled={isSaving}
            className="flex items-center justify-center h-7 w-5 rounded-r bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-400 hover:text-slate-200 transition-colors border border-slate-600"
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
      </div>

      <div className="toolbar-separator" />

      {/* Édition */}
      <ToolbarButton icon={<Clipboard size={15} />} label="Coller" />

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

      {/* Calibrer button */}
      <Tooltip text="Calibrer l'échelle en cliquant 2 points" position="bottom">
        <button
          onClick={onCalibrateClick}
          className={`flex items-center gap-1.5 px-2 h-7 rounded text-xs font-medium transition-colors shrink-0 ${
            calibrationMode
              ? 'bg-amber-500 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
          }`}
        >
          <Crosshair size={13} />
          <span className="hidden sm:block">Calibrer</span>
        </button>
      </Tooltip>

      <div className="toolbar-separator" />

      {/* Outils */}
      <ToolbarButton
        icon={<MousePointer2 size={15} />}
        label="Pointeur"
        active={activeTool === 'pointer'}
        onClick={() => setActiveTool('pointer')}
      />
      {/* Surface with picker */}
      <div className="relative flex items-center">
        <Tooltip text="Surface" position="bottom">
          <button
            onClick={onSurfaceClick}
            className={`flex items-center gap-1 px-1.5 h-7 rounded-l text-xs font-medium transition-colors ${
              activeTool === 'surface'
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square size={15} />
            <span className="hidden sm:block text-xs">Surface</span>
          </button>
        </Tooltip>
        <Tooltip text="Groupes surface existants" position="bottom">
          <button
            onClick={() => setShowGroupPicker('surface')}
            className="flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
      </div>

      {/* Périmètre with picker */}
      <div className="relative flex items-center">
        <Tooltip text="Périmètre" position="bottom">
          <button
            onClick={onPerimetreClick}
            className={`flex items-center gap-1 px-1.5 h-7 rounded-l text-xs font-medium transition-colors ${
              activeTool === 'perimetre'
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Spline size={15} />
            <span className="hidden sm:block text-xs">Périmètre</span>
          </button>
        </Tooltip>
        <Tooltip text="Groupes existants" position="bottom">
          <button
            onClick={() => setShowGroupPicker('perimeter')}
            className="flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
      </div>

      {/* Distance with picker */}
      <div className="relative flex items-center">
        <Tooltip text="Distance (2 points)" position="bottom">
          <button
            onClick={onDistanceClick}
            className={`flex items-center gap-1 px-1.5 h-7 rounded-l text-xs font-medium transition-colors ${
              activeTool === 'distance'
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler size={15} />
            <span className="hidden sm:block text-xs">Distance</span>
          </button>
        </Tooltip>
        <Tooltip text="Groupes distance existants" position="bottom">
          <button
            onClick={() => setShowGroupPicker('distance')}
            className="flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
      </div>

      {/* Compteur with picker */}
      <div className="relative flex items-center">
        <Tooltip text="Compteur" position="bottom">
          <button
            onClick={onCounterClick}
            className={`flex items-center gap-1 px-1.5 h-7 rounded-l text-xs font-medium transition-colors ${
              activeTool === 'compteur'
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash size={15} />
            <span className="hidden sm:block text-xs">Compteur</span>
          </button>
        </Tooltip>
        <Tooltip text="Groupes compteur existants" position="bottom">
          <button
            onClick={() => setShowGroupPicker('counter')}
            className="flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
      </div>

      <div className="toolbar-separator" />

      {/* Annotations */}
      <ToolbarButton
        icon={<PenSquare size={15} />}
        label="Marquer une zone"
        active={activeTool === 'marquer'}
        onClick={onZoneClick}
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
      <ToolbarButton icon={<span className="text-xs font-bold">1:1</span>} label="Taille normale" onClick={onZoomFit} />
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
      <ToolbarButton icon={<RotateCcw size={15} />} label="Retourner / Pivoter" />

      <div className="toolbar-separator" />

      {/* Imprimer / Exporter */}
      <ToolbarButton icon={<Printer size={15} />} label="Imprimer" onClick={onPrint} />
      <ToolbarButton icon={<FileDown size={15} />} label="Exporter vers PDF" />

      {/* Export Excel — last button, green, pushed to the right */}
      <button
        onClick={onExportExcel}
        className="flex items-center gap-1.5 px-2.5 h-7 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors shrink-0 ml-auto"
      >
        <FileSpreadsheet size={13} />
        Export Excel
      </button>

      {/* Group picker popup */}
      {showGroupPicker && (
        <GroupPickerModal
          type={showGroupPicker}
          perimeterGroups={perimeterGroups}
          counterGroups={counterGroups}
          onSelectPerimeterGroup={g => { onStartDrawingForGroup(g); setShowGroupPicker(null) }}
          onSelectCounterGroup={g => { onStartCounterForGroup(g); setShowGroupPicker(null) }}
          onClose={() => setShowGroupPicker(null)}
        />
      )}
    </div>
  )
}
