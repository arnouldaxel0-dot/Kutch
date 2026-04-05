import { useState } from 'react'
import type { Plan, PerimeterGroup, SelectedElement } from '../../types'
import type { Calibration } from '../../App'

type Tab = 'proprietes' | 'extensions' | 'items'
type Scope = 'ce-plan' | 'tous-plans'

interface PropertiesPanelProps {
  selectedElement: SelectedElement | null
  perimeterGroups: PerimeterGroup[]
  activePlan: Plan | null
  calibration: Calibration | null
}

function formatLength(px: number, calibration: Calibration | null): string {
  if (!calibration) return `${Math.round(px)} px`
  return `${(px / calibration.pixelsPerUnit).toFixed(2)} ${calibration.unit}`
}

export default function PropertiesPanel({ selectedElement, perimeterGroups, activePlan, calibration }: PropertiesPanelProps) {
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
          { id: 'items', label: "Items" },
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
            {/* Selected perimeter */}
            {selectedElement && selectedGroup && selectedPath && (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedGroup.color }} />
                  <span className="text-xs font-semibold text-slate-200 truncate">{selectedGroup.name}</span>
                </div>
                <Row label="Type" value="Périmètre" />
                <Row label="Longueur" value={formatLength(selectedPath.length, calibration)} accent />
                <Row label="Épaisseur" value={`${selectedGroup.thickness}`} />
                {selectedGroup.height !== undefined && <Row label="Hauteur" value={`${selectedGroup.height} m`} />}
                {selectedGroup.width !== undefined && <Row label="Largeur" value={`${selectedGroup.width} m`} />}
                <Row label="Points" value={`${selectedPath.points.length}`} />
              </>
            )}

            {/* Active PDF plan when nothing selected */}
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

            {/* Nothing at all */}
            {!selectedElement && !activePlan && (
              <p className="text-xs text-slate-600 italic">Aucun élément sélectionné</p>
            )}
          </div>
        )}

        {activeTab === 'extensions' && (
          <div className="text-xs text-slate-500 italic">Aucune extension active</div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-1">
            {perimeterGroups.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Aucun élément mesuré</p>
            ) : (
              perimeterGroups.map(g => (
                <div key={g.id} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="text-slate-400 truncate">{g.name}</span>
                  </div>
                  <span className="text-slate-300 shrink-0 ml-2">{formatLength(g.totalLength, calibration)}</span>
                </div>
              ))
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
