import { useState } from 'react'

type Tab = 'proprietes' | 'extensions' | 'items'
type Scope = 'ce-plan' | 'tous-plans'

export default function PropertiesPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('proprietes')
  const [scope, setScope] = useState<Scope>('ce-plan')

  return (
    <div className="flex flex-col bg-slate-900 px-2 pt-2 pb-3 gap-2">
      {/* Tabs */}
      <div className="flex gap-0.5 bg-slate-800 rounded p-0.5">
        {([
          { id: 'proprietes', label: 'Propriétés' },
          { id: 'extensions', label: 'Extensions' },
          { id: 'items', label: "Items d'estimation" },
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
      <div className="min-h-[80px]">
        {activeTab === 'proprietes' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Nom du plan</span>
              <span className="text-slate-300 font-medium text-right truncate max-w-[100px]">2_ST12-PH5S1</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Échelle</span>
              <span className="text-slate-300">1:100</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Format</span>
              <span className="text-slate-300">A1</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-300">22/05/2023</span>
            </div>
          </div>
        )}
        {activeTab === 'extensions' && (
          <div className="text-xs text-slate-500 italic">Aucune extension active</div>
        )}
        {activeTab === 'items' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800">
              <span className="text-slate-400">Surface transfo</span>
              <span className="text-slate-300">21,69 m²</span>
            </div>
            <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800">
              <span className="text-slate-400">VCT</span>
              <span className="text-slate-300">149,39 m</span>
            </div>
            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-400">poteaux</span>
              <span className="text-slate-300">2 Unités</span>
            </div>
          </div>
        )}
      </div>

      {/* Scope radio buttons */}
      <div className="flex gap-2 mt-1">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="scope"
            value="ce-plan"
            checked={scope === 'ce-plan'}
            onChange={() => setScope('ce-plan')}
            className="accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-slate-300">Pour ce plan</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="scope"
            value="tous-plans"
            checked={scope === 'tous-plans'}
            onChange={() => setScope('tous-plans')}
            className="accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-slate-300">Tous les plans</span>
        </label>
      </div>
    </div>
  )
}
