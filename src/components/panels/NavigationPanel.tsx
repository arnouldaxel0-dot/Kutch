export default function NavigationPanel() {
  return (
    <div className="p-2 bg-slate-900">
      {/* Minimap showing a simple floor plan */}
      <div className="relative bg-white rounded border border-slate-600 overflow-hidden" style={{ height: '110px' }}>
        <svg
          viewBox="0 0 200 130"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background grid */}
          <defs>
            <pattern id="miniGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="200" height="130" fill="url(#miniGrid)" />

          {/* Floor plan outline */}
          <rect x="15" y="10" width="170" height="110" fill="none" stroke="#374151" strokeWidth="1.5" />

          {/* Interior walls */}
          <line x1="80" y1="10" x2="80" y2="70" stroke="#374151" strokeWidth="1" />
          <line x1="80" y1="70" x2="15" y2="70" stroke="#374151" strokeWidth="1" />
          <line x1="130" y1="10" x2="130" y2="55" stroke="#374151" strokeWidth="1" />
          <line x1="130" y1="55" x2="185" y2="55" stroke="#374151" strokeWidth="1" />
          <line x1="80" y1="90" x2="130" y2="90" stroke="#374151" strokeWidth="1" />

          {/* Door symbols */}
          <path d="M 78 68 Q 75 68 75 65" fill="none" stroke="#6b7280" strokeWidth="0.7" />
          <path d="M 128 53 Q 128 50 125 50" fill="none" stroke="#6b7280" strokeWidth="0.7" />

          {/* Window symbols */}
          <rect x="35" y="9" width="20" height="3" fill="white" stroke="#374151" strokeWidth="0.7" />
          <line x1="35" y1="10.5" x2="55" y2="10.5" stroke="#374151" strokeWidth="0.4" />
          <rect x="140" y="9" width="20" height="3" fill="white" stroke="#374151" strokeWidth="0.7" />

          {/* Viewport indicator */}
          <rect x="15" y="10" width="170" height="110" fill="rgba(99,102,241,0.08)" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2" />
        </svg>
      </div>
    </div>
  )
}
