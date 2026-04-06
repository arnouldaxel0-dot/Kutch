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
} from 'lucide-react'
import type { Tool } from '../App'
import type { PerimeterGroup, CounterGroup } from '../types'
import ToolbarButton from './ui/ToolbarButton'
import Tooltip from './ui/Tooltip'

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
}: ToolbarProps) {
  const [showPerimeterDropdown, setShowPerimeterDropdown] = useState(false)
  const [showSurfaceDropdown, setShowSurfaceDropdown] = useState(false)
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false)
  const [showCounterDropdown, setShowCounterDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const surfaceDropdownRef = useRef<HTMLDivElement>(null)
  const distanceDropdownRef = useRef<HTMLDivElement>(null)
  const counterDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowPerimeterDropdown(false)
      if (surfaceDropdownRef.current && !surfaceDropdownRef.current.contains(e.target as Node)) setShowSurfaceDropdown(false)
      if (distanceDropdownRef.current && !distanceDropdownRef.current.contains(e.target as Node)) setShowDistanceDropdown(false)
      if (counterDropdownRef.current && !counterDropdownRef.current.contains(e.target as Node)) setShowCounterDropdown(false)
    }
    if (showPerimeterDropdown || showSurfaceDropdown || showDistanceDropdown || showCounterDropdown) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPerimeterDropdown, showSurfaceDropdown, showDistanceDropdown, showCounterDropdown])

  return (
    <div className="flex items-center h-10 bg-slate-800 border-b border-slate-700 px-2 gap-0.5 shrink-0 overflow-x-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 pr-2 border-r border-slate-600">
        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">K</span>
        </div>
        <span className="text-slate-300 text-sm font-semibold hidden sm:block">Kutch</span>
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
      {/* Surface with dropdown arrow */}
      <div className="relative flex items-center" ref={surfaceDropdownRef}>
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
            onClick={() => setShowSurfaceDropdown(v => !v)}
            className={`flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 transition-colors ${
              showSurfaceDropdown
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
        {showSurfaceDropdown && (
          <div className="absolute top-8 left-0 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-40 py-1 overflow-hidden">
            {perimeterGroups.filter(g => g.type === 'surface').length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 italic">Aucun groupe surface</div>
            ) : (
              perimeterGroups.filter(g => g.type === 'surface').map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    onStartDrawingForGroup(group)
                    setShowSurfaceDropdown(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-xs text-slate-300 truncate">{group.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Périmètre with dropdown arrow */}
      <div className="relative flex items-center" ref={dropdownRef}>
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
            onClick={() => setShowPerimeterDropdown(v => !v)}
            className={`flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 transition-colors ${
              showPerimeterDropdown
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>

        {/* Dropdown */}
        {showPerimeterDropdown && (
          <div className="absolute top-8 left-0 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-40 py-1 overflow-hidden">
            {perimeterGroups.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 italic">Aucun groupe existant</div>
            ) : (
              perimeterGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    onStartDrawingForGroup(group)
                    setShowPerimeterDropdown(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-xs text-slate-300 truncate">{group.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Distance with dropdown arrow */}
      <div className="relative flex items-center" ref={distanceDropdownRef}>
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
            onClick={() => setShowDistanceDropdown(v => !v)}
            className={`flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 transition-colors ${
              showDistanceDropdown ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
        {showDistanceDropdown && (
          <div className="absolute top-8 left-0 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-40 py-1 overflow-hidden">
            {perimeterGroups.filter(g => g.type === 'distance').length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 italic">Aucun groupe distance</div>
            ) : (
              perimeterGroups.filter(g => g.type === 'distance').map(group => (
                <button
                  key={group.id}
                  onClick={() => { onStartDrawingForGroup(group); setShowDistanceDropdown(false) }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  <span className="text-xs text-slate-300 truncate">{group.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {/* Compteur with dropdown arrow */}
      <div className="relative flex items-center" ref={counterDropdownRef}>
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
            onClick={() => setShowCounterDropdown(v => !v)}
            className={`flex items-center justify-center h-7 w-4 rounded-r border-l border-slate-700 transition-colors ${
              showCounterDropdown
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <ChevronDown size={11} />
          </button>
        </Tooltip>
        {showCounterDropdown && (
          <div className="absolute top-8 left-0 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-40 py-1 overflow-hidden">
            {counterGroups.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 italic">Aucun groupe compteur</div>
            ) : (
              counterGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    onStartCounterForGroup(group)
                    setShowCounterDropdown(false)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-xs text-slate-300 truncate">{group.name}</span>
                  <span className="ml-auto text-slate-500 text-xs shrink-0">{group.markers.length}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

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
      <ToolbarButton icon={<Printer size={15} />} label="Imprimer" />
      <ToolbarButton icon={<FileDown size={15} />} label="Exporter vers PDF" />

      {/* Export Excel — last button, green, pushed to the right */}
      <button
        onClick={onExportExcel}
        className="flex items-center gap-1.5 px-2.5 h-7 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors shrink-0 ml-auto"
      >
        <FileSpreadsheet size={13} />
        Export Excel
      </button>
    </div>
  )
}
