import { useState } from 'react'
import type { Plan, PerimeterGroup, SelectedElement, Point } from '../../types'
import type { Calibration } from '../../App'

type Tab = 'proprietes' | 'extensions' | 'chiffrage'
type Scope = 'ce-plan' | 'tous-plans'

interface PropertiesPanelProps {
  selectedElement: SelectedElement | null
  perimeterGroups: PerimeterGroup[]
  activePlan: Plan | null
  calibration: Calibration | null
  onUpdateGroup: (groupId: string, updates: Partial<PerimeterGroup>) => void
}

function fmtLength(px: number, cal: Calibration | null) {
  if (!cal) return `${Math.round(px)} px`
  return `${(px / cal.pixelsPerUnit).toFixed(2)} ${cal.unit}`
}
function fmtArea(px2: number, cal: Calibration | null) {
  if (!cal) return `${Math.round(px2)} px²`
  return `${(px2 / (cal.pixelsPerUnit ** 2)).toFixed(2)} ${cal.unit}²`
}
function calcPerimeter(points: Point[]) {
  return points.slice(1).reduce((sum, p, i) => {
    const dx = p.x - points[i].x
    const dy = p.y - points[i].y
    return sum + Math.sqrt(dx * dx + dy * dy)
  }, 0)
}

export default function PropertiesPanel({ selectedElement, perimeterGroups, activePlan, calibration, onUpdateGroup }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('proprietes')
  const [scope, setScope] = useState<Scope>('ce-plan')

  const selectedGroup = selectedElement
    ? perimeterGroups.find(g => g.id === selectedElement.groupId)
    : null
  const selectedPath = selectedGroup
    ? selectedGroup.paths.find(p => p.id === selectedElement?.pathId)
    : null

  return (
    <div className="flex flex-col bg-slate-900 px-2 pt-2 pb-3 gap-2 h-full overflow-y-auto">
      {/* Tabs */}
      <div className="flex gap-0.5 bg-slate-800 rounded p-0.5">
        {([
          { id: 'proprietes', label: 'Propriétés' },
          { id: 'extensions', label: 'Extensions' },
          { id: 'chiffrage', label: 'Chiffrage' },
        ] as { id: Tab; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-1 py-1 text-[10px] rounded transition-colors duration-150 leading-tight ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-[60px]">
        {activeTab === 'proprietes' && (
          <div className="space-y-1.5">
            {selectedElement && selectedGroup && selectedPath && (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedGroup.color }} />
                  <span className="text-xs font-semibold text-slate-200 truncate">{selectedGroup.name}</span>
                </div>
                <Row label="Type" value={selectedGroup.type === 'surface' ? 'Surface' : 'Périmètre'} />
                {selectedGroup.type === 'surface' ? (
                  <>
                    <Row label="Périmètre" value={fmtLength(calcPerimeter(selectedPath.points), calibration)} accent />
                    <Row label="Surface" value={fmtArea(selectedPath.length, calibration)} accent />
                  </>
                ) : (
                  <Row label={selectedGroup.type === 'distance' ? 'Distance' : 'Longueur'} value={fmtLength(selectedPath.length, calibration)} accent />
                )}
                <Row label="Épaisseur" value={`${selectedGroup.thickness}`} />
                {selectedGroup.height !== undefined && <Row label="Hauteur" value={`${selectedGroup.height} m`} />}
                {selectedGroup.width !== undefined && <Row label="Largeur" value={`${selectedGroup.width} m`} />}
                <Row label="Points" value={`${selectedPath.points.length}`} />
              </>
            )}

            {!selectedElement && activePlan && (
              <>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Plan PDF</div>
                <Row label="Nom" value={activePlan.name} />
                <Row label="Importé" value={activePlan.importedAt} />
                {calibration && (
                  <Row label="Calibration" value={`1 px = ${(1 / calibration.pixelsPerUnit).toFixed(4)} ${calibration.unit}`} />
                )}
              </>
            )}

            {!selectedElement && !activePlan && (
              <p className="text-xs text-slate-600 italic">Aucun élément sélectionné</p>
            )}
          </div>
        )}

        {activeTab === 'extensions' && (
          <div className="text-xs text-slate-500 italic">Aucune extension active</div>
        )}

        {activeTab === 'chiffrage' && (
          <div className="space-y-2">
            {perimeterGroups.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Aucun élément mesuré</p>
            ) : (
              perimeterGroups.map(g => {
                const isSurface = g.type === 'surface'
                const totalM = calibration ? g.totalLength / calibration.pixelsPerUnit : null
                const totalM2 = calibration ? g.totalLength / (calibration.pixelsPerUnit ** 2) : null

                const costM2 = (g.pricePerM2 && totalM2) ? g.pricePerM2 * totalM2 : null
                const costM3 = (g.pricePerM3 && totalM2 && g.elementThickness) ? g.pricePerM3 * totalM2 * g.elementThickness : null
                const costML = (g.pricePerML && totalM) ? g.pricePerML * totalM : null

                return (
                  <div key={g.id} className="border border-slate-700 rounded-md overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-800">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="text-[11px] font-medium text-slate-200 truncate flex-1">{g.name}</span>
                      <span className="text-[9px] text-slate-500">{isSurface ? 'Surface' : 'Périmètre'}</span>
                    </div>
                    <div className="px-2 py-1.5 space-y-1.5">
                      {/* Prix/m² */}
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-500 w-16 shrink-0">Prix/m²</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={g.pricePerM2 ?? ''}
                          onChange={e => onUpdateGroup(g.id, { pricePerM2: e.target.value === '' ? undefined : Number(e.target.value) })}
                          placeholder="0.00"
                          className="flex-1 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                        />
                        {costM2 !== null && (
                          <span className="text-[10px] text-green-400 shrink-0 w-14 text-right">{costM2.toFixed(2)} €</span>
                        )}
                      </div>
                      {/* Prix/m³ */}
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-500 w-16 shrink-0">Prix/m³</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={g.pricePerM3 ?? ''}
                          onChange={e => onUpdateGroup(g.id, { pricePerM3: e.target.value === '' ? undefined : Number(e.target.value) })}
                          placeholder="0.00"
                          className="flex-1 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                        />
                        {costM3 !== null && (
                          <span className="text-[10px] text-green-400 shrink-0 w-14 text-right">{costM3.toFixed(2)} €</span>
                        )}
                      </div>
                      {/* Prix/mL */}
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-500 w-16 shrink-0">Prix/mL</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={g.pricePerML ?? ''}
                          onChange={e => onUpdateGroup(g.id, { pricePerML: e.target.value === '' ? undefined : Number(e.target.value) })}
                          placeholder="0.00"
                          className="flex-1 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                        />
                        {costML !== null && (
                          <span className="text-[10px] text-green-400 shrink-0 w-14 text-right">{costML.toFixed(2)} €</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Scope radio buttons */}
      <div className="flex gap-2 mt-1">
        {(['ce-plan', 'tous-plans'] as Scope[]).map(s => (
          <label key={s} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="scope"
              value={s}
              checked={scope === s}
              onChange={() => setScope(s)}
              className="accent-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-300">{s === 'ce-plan' ? 'Pour ce plan' : 'Tous les plans'}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`${accent ? 'text-indigo-300 font-semibold' : 'text-slate-300'} text-right truncate max-w-[110px]`}>{value}</span>
    </div>
  )
}
