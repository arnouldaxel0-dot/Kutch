import type { Tool } from '../App'

interface MainCanvasProps {
  activeTool: Tool
  zoom: number
  activePlan: string
}

const TOOL_CURSORS: Record<Tool, string> = {
  pointer: 'default',
  cadrage: 'crosshair',
  surface: 'crosshair',
  perimetre: 'crosshair',
  distance: 'crosshair',
  compteur: 'cell',
  angle: 'crosshair',
  marquer: 'crosshair',
  note: 'text',
}

export default function MainCanvas({ activeTool, zoom, activePlan }: MainCanvasProps) {
  const cursor = TOOL_CURSORS[activeTool]
  const scale = zoom / 100

  return (
    <div className="flex-1 flex flex-col bg-slate-700 overflow-hidden">
      {/* Plan title bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-200">{activePlan}</span>
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">A1</span>
          <span className="text-xs text-slate-500">22/05/2023</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Zoom: {zoom}%</span>
          <div className="w-px h-4 bg-slate-600" />
          <span className="text-xs text-slate-500 capitalize">{activeTool}</span>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-8"
        style={{ cursor, background: 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(99,102,241,0.03) 24px, rgba(99,102,241,0.03) 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(99,102,241,0.03) 24px, rgba(99,102,241,0.03) 25px)' }}
      >
        {/* Paper / Plan */}
        <div
          className="bg-white shadow-2xl relative"
          style={{
            width: `${841 * scale}px`,
            height: `${594 * scale}px`,
            minWidth: `${841 * scale}px`,
            minHeight: `${594 * scale}px`,
            transformOrigin: 'center',
          }}
        >
          {/* Floor plan SVG */}
          <svg
            viewBox="0 0 841 594"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
              </pattern>
              <pattern id="gridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#grid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e0e0e0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="841" height="594" fill="url(#gridMajor)" />

            {/* Title block border */}
            <rect x="10" y="10" width="821" height="574" fill="none" stroke="#333" strokeWidth="1.5" />
            <rect x="10" y="10" width="821" height="574" fill="none" stroke="#555" strokeWidth="0.5" rx="1" />

            {/* Title block at bottom */}
            <rect x="10" y="530" width="821" height="54" fill="#f8f8f8" stroke="#333" strokeWidth="1" />
            <line x1="300" y1="530" x2="300" y2="584" stroke="#aaa" strokeWidth="0.5" />
            <line x1="550" y1="530" x2="550" y2="584" stroke="#aaa" strokeWidth="0.5" />
            <line x1="700" y1="530" x2="700" y2="584" stroke="#aaa" strokeWidth="0.5" />

            <text x="155" y="552" textAnchor="middle" fontSize="8" fill="#666">HGA ARCHITECTURE</text>
            <text x="155" y="565" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#222">2_ST12-PH5S1</text>
            <text x="155" y="578" textAnchor="middle" fontSize="7" fill="#888">Plan de surface - Niveau R+1</text>

            <text x="425" y="548" textAnchor="middle" fontSize="7" fill="#666">Projet:</text>
            <text x="425" y="560" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#333">ST GERMAIN DCE</text>
            <text x="425" y="572" textAnchor="middle" fontSize="7" fill="#666">Phase 5 - Section 1</text>

            <text x="625" y="548" textAnchor="middle" fontSize="7" fill="#666">Échelle: 1:100</text>
            <text x="625" y="560" textAnchor="middle" fontSize="7" fill="#666">Format: A1</text>
            <text x="625" y="572" textAnchor="middle" fontSize="7" fill="#666">Date: 22/05/2023</text>

            <text x="770" y="552" textAnchor="middle" fontSize="7" fill="#666">N° Plan:</text>
            <text x="770" y="566" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">PLN_102</text>
            <text x="770" y="578" textAnchor="middle" fontSize="7" fill="#666">Rév. A</text>

            {/* Main floor plan - complex floor plan */}
            {/* Outer walls */}
            <rect x="80" y="60" width="480" height="420" fill="#fafafa" stroke="#222" strokeWidth="2.5" />

            {/* Interior partition walls */}
            {/* Horizontal walls */}
            <line x1="80" y1="180" x2="280" y2="180" stroke="#222" strokeWidth="2" />
            <line x1="330" y1="180" x2="560" y2="180" stroke="#222" strokeWidth="2" />
            <line x1="80" y1="310" x2="200" y2="310" stroke="#222" strokeWidth="2" />
            <line x1="200" y1="310" x2="200" y2="480" stroke="#222" strokeWidth="2" />
            <line x1="280" y1="310" x2="560" y2="310" stroke="#222" strokeWidth="2" />
            <line x1="280" y1="180" x2="280" y2="370" stroke="#222" strokeWidth="2" />
            <line x1="280" y1="410" x2="280" y2="480" stroke="#222" strokeWidth="2" />
            <line x1="400" y1="180" x2="400" y2="310" stroke="#222" strokeWidth="2" />
            <line x1="200" y1="370" x2="360" y2="370" stroke="#222" strokeWidth="2" />
            <line x1="360" y1="370" x2="360" y2="480" stroke="#222" strokeWidth="2" />
            <line x1="360" y1="430" x2="560" y2="430" stroke="#222" strokeWidth="2" />

            {/* Doors - arcs indicating swing */}
            <path d="M 280 368 Q 260 350 278 330" fill="none" stroke="#555" strokeWidth="0.8" strokeDasharray="2,1" />
            <path d="M 280 412 Q 260 430 278 450" fill="none" stroke="#555" strokeWidth="0.8" strokeDasharray="2,1" />
            <path d="M 328 180 Q 310 200 330 220" fill="none" stroke="#555" strokeWidth="0.8" strokeDasharray="2,1" />
            <path d="M 198 330 Q 180 320 180 310" fill="none" stroke="#555" strokeWidth="0.8" strokeDasharray="2,1" />
            <path d="M 358 400 Q 370 398 370 370" fill="none" stroke="#555" strokeWidth="0.8" strokeDasharray="2,1" />

            {/* Windows */}
            <rect x="80" y="100" width="4" height="40" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="82" y1="100" x2="82" y2="140" stroke="#222" strokeWidth="0.5" />
            <rect x="80" y="200" width="4" height="60" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="82" y1="200" x2="82" y2="260" stroke="#222" strokeWidth="0.5" />
            <rect x="80" y="360" width="4" height="60" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="82" y1="360" x2="82" y2="420" stroke="#222" strokeWidth="0.5" />

            <rect x="200" y="56" width="60" height="4" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="200" y1="58" x2="260" y2="58" stroke="#222" strokeWidth="0.5" />
            <rect x="360" y="56" width="80" height="4" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="360" y1="58" x2="440" y2="58" stroke="#222" strokeWidth="0.5" />

            <rect x="556" y="100" width="4" height="50" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="558" y1="100" x2="558" y2="150" stroke="#222" strokeWidth="0.5" />
            <rect x="556" y="220" width="4" height="60" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="558" y1="220" x2="558" y2="280" stroke="#222" strokeWidth="0.5" />
            <rect x="556" y="350" width="4" height="60" fill="white" stroke="#222" strokeWidth="1.5" />
            <line x1="558" y1="350" x2="558" y2="410" stroke="#222" strokeWidth="0.5" />

            {/* Structural columns */}
            <rect x="76" y="56" width="8" height="8" fill="#666" stroke="#333" strokeWidth="0.5" />
            <rect x="556" y="56" width="8" height="8" fill="#666" stroke="#333" strokeWidth="0.5" />
            <rect x="76" y="476" width="8" height="8" fill="#666" stroke="#333" strokeWidth="0.5" />
            <rect x="556" y="476" width="8" height="8" fill="#666" stroke="#333" strokeWidth="0.5" />
            <rect x="276" y="56" width="8" height="8" fill="#888" stroke="#333" strokeWidth="0.5" />
            <rect x="396" y="56" width="8" height="8" fill="#888" stroke="#333" strokeWidth="0.5" />
            <rect x="276" y="476" width="8" height="8" fill="#888" stroke="#333" strokeWidth="0.5" />
            <rect x="396" y="476" width="8" height="8" fill="#888" stroke="#333" strokeWidth="0.5" />

            {/* Room labels */}
            <text x="155" y="130" textAnchor="middle" fontSize="9" fill="#444" fontStyle="italic">Bureau A</text>
            <text x="155" y="143" textAnchor="middle" fontSize="7" fill="#888">21,69 m²</text>

            <text x="420" y="130" textAnchor="middle" fontSize="9" fill="#444" fontStyle="italic">Salle de réunion</text>
            <text x="420" y="143" textAnchor="middle" fontSize="7" fill="#888">48,3 m²</text>

            <text x="155" y="250" textAnchor="middle" fontSize="9" fill="#444" fontStyle="italic">Hall / Circulation</text>
            <text x="155" y="263" textAnchor="middle" fontSize="7" fill="#888">18,61 m²</text>

            <text x="340" y="250" textAnchor="middle" fontSize="9" fill="#444" fontStyle="italic">Open Space</text>
            <text x="340" y="263" textAnchor="middle" fontSize="7" fill="#888">62,24 m²</text>

            <text x="130" y="410" textAnchor="middle" fontSize="9" fill="#444" fontStyle="italic">Sanitaires</text>
            <text x="130" y="423" textAnchor="middle" fontSize="7" fill="#888">12,33 m²</text>

            <text x="310" y="410" textAnchor="middle" fontSize="9" fill="#444" fontStyle="italic">Local tech.</text>
            <text x="310" y="423" textAnchor="middle" fontSize="7" fill="#888">9,91 m²</text>

            <text x="460" y="400" textAnchor="middle" fontSize="9" fill="#444" fontStyle="italic">Archives</text>
            <text x="460" y="413" textAnchor="middle" fontSize="7" fill="#888">15,58 m²</text>

            {/* Dimension lines */}
            <line x1="80" y1="50" x2="560" y2="50" stroke="#e67e22" strokeWidth="0.7" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
            <text x="320" y="47" textAnchor="middle" fontSize="7" fill="#e67e22">24.00 m</text>

            <line x1="70" y1="60" x2="70" y2="480" stroke="#e67e22" strokeWidth="0.7" />
            <text x="60" y="270" textAnchor="middle" fontSize="7" fill="#e67e22" transform="rotate(-90 60 270)">21.00 m</text>

            {/* Measurement annotations (colored polylines) */}
            {/* VCT measurement line in indigo */}
            <polyline
              points="90,180 90,310 200,310 200,370 280,370 280,480"
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="none"
            />
            {/* Surface annotation */}
            <rect x="85" y="65" width="190" height="110" fill="rgba(99,102,241,0.08)" stroke="#6366f1" strokeWidth="1" strokeDasharray="4,2" />

            {/* North arrow */}
            <g transform="translate(520, 85)">
              <circle cx="0" cy="0" r="15" fill="none" stroke="#333" strokeWidth="1" />
              <polygon points="0,-12 4,0 -4,0" fill="#333" />
              <polygon points="0,12 4,0 -4,0" fill="white" stroke="#333" strokeWidth="0.5" />
              <text x="0" y="-16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#333">N</text>
            </g>

            {/* Scale bar */}
            <g transform="translate(430, 510)">
              <line x1="0" y1="0" x2="100" y2="0" stroke="#333" strokeWidth="1" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#333" strokeWidth="1" />
              <line x1="50" y1="-2" x2="50" y2="2" stroke="#333" strokeWidth="0.8" />
              <line x1="100" y1="-4" x2="100" y2="4" stroke="#333" strokeWidth="1" />
              <rect x="0" y="-4" width="50" height="4" fill="#333" />
              <rect x="50" y="-4" width="50" height="4" fill="white" stroke="#333" strokeWidth="0.5" />
              <text x="0" y="10" textAnchor="middle" fontSize="6" fill="#333">0</text>
              <text x="50" y="10" textAnchor="middle" fontSize="6" fill="#333">5m</text>
              <text x="100" y="10" textAnchor="middle" fontSize="6" fill="#333">10m</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-1 bg-slate-800 border-t border-slate-700 shrink-0">
        <span className="text-xs text-slate-500">x: 0.00 m</span>
        <span className="text-xs text-slate-500">y: 0.00 m</span>
        <div className="flex-1" />
        <span className="text-xs text-slate-500">Calque par défaut</span>
        <div className="w-px h-3 bg-slate-600" />
        <span className="text-xs text-slate-500">1:100</span>
        <div className="w-px h-3 bg-slate-600" />
        <span className="text-xs text-slate-400">{zoom}%</span>
      </div>
    </div>
  )
}
