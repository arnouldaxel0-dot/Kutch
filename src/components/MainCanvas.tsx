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
  return (
    <div
      className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col"
      style={{ cursor: TOOL_CURSORS[activeTool] }}
    >
      {/* Plan title bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 border-b border-slate-700 shrink-0 backdrop-blur-sm">
        <span className="text-sm font-medium text-slate-200">{activePlan}</span>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Quater Plan — projet appel d'offre (16-Mars-2026).qpl</span>
          <span className="text-slate-600">|</span>
          <span>{zoom}%</span>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <div
          className="relative bg-white shadow-2xl shadow-black/50"
          style={{
            width: `${8.27 * zoom * 1.2}px`,
            height: `${5.83 * zoom * 1.2}px`,
            minWidth: '400px',
            minHeight: '280px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Floor plan SVG */}
          <svg
            viewBox="0 0 800 566"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.3" />
              </pattern>
              <pattern id="gridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#grid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d1d5db" strokeWidth="0.5" />
              </pattern>
            </defs>

            {/* Background */}
            <rect width="800" height="566" fill="white" />
            <rect width="800" height="566" fill="url(#gridMajor)" />

            {/* Outer building boundary */}
            <rect x="50" y="50" width="700" height="466" fill="none" stroke="#1f2937" strokeWidth="3" />

            {/* Main rooms */}
            {/* Room 1 - top left large */}
            <rect x="50" y="50" width="280" height="200" fill="rgba(99,102,241,0.03)" stroke="#374151" strokeWidth="1.5" />
            {/* Room 2 - top center */}
            <rect x="330" y="50" width="200" height="150" fill="rgba(16,185,129,0.03)" stroke="#374151" strokeWidth="1.5" />
            {/* Room 3 - top right */}
            <rect x="530" y="50" width="220" height="200" fill="rgba(245,158,11,0.03)" stroke="#374151" strokeWidth="1.5" />
            {/* Room 4 - middle */}
            <rect x="50" y="250" width="180" height="130" fill="rgba(239,68,68,0.03)" stroke="#374151" strokeWidth="1.5" />
            {/* Room 5 - center large */}
            <rect x="230" y="200" width="340" height="200" fill="rgba(139,92,246,0.04)" stroke="#374151" strokeWidth="1.5" />
            {/* Room 6 - right middle */}
            <rect x="570" y="250" width="180" height="130" fill="rgba(20,184,166,0.03)" stroke="#374151" strokeWidth="1.5" />
            {/* Room 7 - bottom left */}
            <rect x="50" y="380" width="280" height="136" fill="rgba(249,115,22,0.03)" stroke="#374151" strokeWidth="1.5" />
            {/* Room 8 - bottom right */}
            <rect x="330" y="400" width="420" height="116" fill="rgba(236,72,153,0.03)" stroke="#374151" strokeWidth="1.5" />
            {/* Corridor */}
            <rect x="230" y="50" width="100" height="466" fill="rgba(0,0,0,0.02)" stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="4,2" />

            {/* Doors */}
            <path d="M 50 180 Q 65 180 65 195" fill="none" stroke="#6b7280" strokeWidth="1.2" />
            <line x1="50" y1="180" x2="50" y2="195" stroke="#6b7280" strokeWidth="1.2" />
            <path d="M 328 130 Q 328 115 313 115" fill="none" stroke="#6b7280" strokeWidth="1.2" />
            <line x1="328" y1="115" x2="328" y2="130" stroke="#6b7280" strokeWidth="1.2" />
            <path d="M 570 320 Q 555 320 555 335" fill="none" stroke="#6b7280" strokeWidth="1.2" />
            <line x1="555" y1="320" x2="570" y2="320" stroke="#6b7280" strokeWidth="1.2" />

            {/* Windows */}
            <rect x="100" y="48" width="60" height="5" fill="white" stroke="#374151" strokeWidth="1" />
            <line x1="100" y1="50.5" x2="160" y2="50.5" stroke="#374151" strokeWidth="0.6" />
            <rect x="380" y="48" width="60" height="5" fill="white" stroke="#374151" strokeWidth="1" />
            <line x1="380" y1="50.5" x2="440" y2="50.5" stroke="#374151" strokeWidth="0.6" />
            <rect x="600" y="48" width="60" height="5" fill="white" stroke="#374151" strokeWidth="1" />
            <line x1="600" y1="50.5" x2="660" y2="50.5" stroke="#374151" strokeWidth="0.6" />
            <rect x="745" y="130" width="5" height="60" fill="white" stroke="#374151" strokeWidth="1" />
            <line x1="747.5" y1="130" x2="747.5" y2="190" stroke="#374151" strokeWidth="0.6" />

            {/* Dimension lines */}
            <line x1="50" y1="530" x2="750" y2="530" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="none" />
            <line x1="50" y1="525" x2="50" y2="535" stroke="#6366f1" strokeWidth="0.8" />
            <line x1="750" y1="525" x2="750" y2="535" stroke="#6366f1" strokeWidth="0.8" />
            <text x="400" y="543" textAnchor="middle" fontSize="9" fill="#6366f1" fontFamily="sans-serif">149,39 m</text>

            <line x1="770" y1="50" x2="770" y2="516" stroke="#6366f1" strokeWidth="0.8" />
            <line x1="765" y1="50" x2="775" y2="50" stroke="#6366f1" strokeWidth="0.8" />
            <line x1="765" y1="516" x2="775" y2="516" stroke="#6366f1" strokeWidth="0.8" />
            <text x="790" y="285" textAnchor="middle" fontSize="9" fill="#6366f1" fontFamily="sans-serif" transform="rotate(90, 790, 285)">62,24 m</text>

            {/* Measurement annotations */}
            <rect x="56" y="56" width="50" height="16" rx="2" fill="rgba(99,102,241,0.15)" />
            <text x="81" y="67" textAnchor="middle" fontSize="7" fill="#6366f1" fontFamily="sans-serif" fontWeight="600">21,69 m²</text>

            <rect x="340" y="210" width="44" height="14" rx="2" fill="rgba(245,158,11,0.15)" />
            <text x="362" y="220" textAnchor="middle" fontSize="7" fill="#d97706" fontFamily="sans-serif" fontWeight="600">18,61 m²</text>

            {/* North arrow */}
            <g transform="translate(720, 90)">
              <circle cx="0" cy="0" r="15" fill="none" stroke="#9ca3af" strokeWidth="0.8" />
              <path d="M 0 -12 L 4 4 L 0 0 L -4 4 Z" fill="#374151" />
              <text x="0" y="-16" textAnchor="middle" fontSize="8" fill="#374151" fontFamily="sans-serif" fontWeight="bold">N</text>
            </g>

            {/* Legend box */}
            <rect x="580" y="420" width="160" height="80" fill="rgba(255,255,255,0.9)" stroke="#9ca3af" strokeWidth="0.8" />
            <text x="660" y="434" textAnchor="middle" fontSize="8" fill="#374151" fontFamily="sans-serif" fontWeight="bold">LÉGENDE</text>
            <rect x="588" y="440" width="10" height="8" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="0.5" />
            <text x="602" y="448" fontSize="7" fill="#374151" fontFamily="sans-serif">Surface transfo</text>
            <rect x="588" y="454" width="10" height="8" fill="rgba(245,158,11,0.15)" stroke="#d97706" strokeWidth="0.5" />
            <text x="602" y="462" fontSize="7" fill="#374151" fontFamily="sans-serif">m² poly transfo</text>
            <line x1="588" y1="468" x2="598" y2="468" stroke="#6366f1" strokeWidth="1.5" />
            <text x="602" y="472" fontSize="7" fill="#374151" fontFamily="sans-serif">VCT / VMT</text>
            <circle cx="593" cy="481" r="3" fill="#ef4444" />
            <text x="602" y="484" fontSize="7" fill="#374151" fontFamily="sans-serif">Poteaux</text>

            {/* Scale bar */}
            <g transform="translate(50, 510)">
              <line x1="0" y1="0" x2="100" y2="0" stroke="#374151" strokeWidth="1" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="#374151" strokeWidth="1" />
              <line x1="50" y1="-2" x2="50" y2="2" stroke="#374151" strokeWidth="0.8" />
              <line x1="100" y1="-3" x2="100" y2="3" stroke="#374151" strokeWidth="1" />
              <text x="0" y="-6" textAnchor="middle" fontSize="6" fill="#374151" fontFamily="sans-serif">0</text>
              <text x="50" y="-6" textAnchor="middle" fontSize="6" fill="#374151" fontFamily="sans-serif">5m</text>
              <text x="100" y="-6" textAnchor="middle" fontSize="6" fill="#374151" fontFamily="sans-serif">10m</text>
              <text x="50" y="10" textAnchor="middle" fontSize="6" fill="#374151" fontFamily="sans-serif">Échelle 1:100</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-slate-800/60 border-t border-slate-700 shrink-0 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Outil: <span className="text-slate-300 capitalize">{activeTool}</span></span>
          <span>Calque: <span className="text-slate-300">Calque par défaut</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ortho</span>
          <span className="text-slate-600">|</span>
          <span>Manuel</span>
          <span className="text-slate-600">|</span>
          <span>Qualité: Haute</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400">{zoom}%</span>
        </div>
      </div>
    </div>
  )
}
