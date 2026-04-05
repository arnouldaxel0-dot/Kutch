import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface MeasurementItem {
  name: string
  value: string
  unit: string
}

interface LayerGroup {
  name: string
  items: MeasurementItem[]
  expanded: boolean
  highlighted?: boolean
}

interface PlanGroup {
  name: string
  layers: LayerGroup[]
  expanded: boolean
}

const INITIAL_GROUPS: PlanGroup[] = [
  {
    name: '2_ST12-PH5S1',
    expanded: true,
    layers: [
      {
        name: 'Calque par défaut',
        expanded: true,
        highlighted: true,
        items: [
          { name: 'Surface transfo', value: '21,69', unit: 'm²' },
          { name: '45x80', value: '6', unit: 'm' },
          { name: '50x66', value: '6,13', unit: 'm' },
          { name: '50x81', value: '7,75', unit: 'm' },
          { name: '65x90', value: '5,83', unit: 'm' },
          { name: '70x60', value: '14,58', unit: 'm' },
          { name: '70x89', value: '13,17', unit: 'm' },
          { name: '70x90', value: '50,72', unit: 'm' },
          { name: '80x60', value: '18,17', unit: 'm' },
          { name: '80x70', value: '15,58', unit: 'm' },
          { name: '80x90', value: '62,24', unit: 'm' },
          { name: '90x89e', value: '9,91', unit: 'm' },
          { name: '90x69', value: '12,33', unit: 'm' },
          { name: 'm² poly transfo', value: '18,61', unit: 'm²' },
          { name: 'VCT', value: '149,39', unit: 'm' },
          { name: 'VMT', value: '137,13', unit: 'm' },
          { name: 'poteaux', value: '2', unit: 'Unités' },
          { name: 'Légende', value: '', unit: '' },
        ],
      },
    ],
  },
]

export default function GroupsPanel() {
  const [groups, setGroups] = useState<PlanGroup[]>(INITIAL_GROUPS)

  const togglePlan = (planIdx: number) => {
    setGroups(prev =>
      prev.map((g, i) => (i === planIdx ? { ...g, expanded: !g.expanded } : g))
    )
  }

  const toggleLayer = (planIdx: number, layerIdx: number) => {
    setGroups(prev =>
      prev.map((g, i) =>
        i === planIdx
          ? {
              ...g,
              layers: g.layers.map((l, j) =>
                j === layerIdx ? { ...l, expanded: !l.expanded } : l
              ),
            }
          : g
      )
    )
  }

  return (
    <div className="overflow-y-auto text-xs bg-slate-900 flex-1">
      {groups.map((plan, planIdx) => (
        <div key={plan.name}>
          {/* Plan row */}
          <button
            onClick={() => togglePlan(planIdx)}
            className="flex items-center gap-1 w-full px-2 py-1.5 hover:bg-slate-700 text-left text-slate-200 font-medium border-b border-slate-800"
          >
            {plan.expanded ? (
              <ChevronDown size={12} className="text-slate-400 shrink-0" />
            ) : (
              <ChevronRight size={12} className="text-slate-400 shrink-0" />
            )}
            <span className="truncate">{plan.name}</span>
          </button>

          {plan.expanded &&
            plan.layers.map((layer, layerIdx) => (
              <div key={layer.name}>
                {/* Layer row */}
                <button
                  onClick={() => toggleLayer(planIdx, layerIdx)}
                  className={`flex items-center gap-1 w-full pl-4 pr-2 py-1.5 text-left border-b border-slate-800 ${
                    layer.highlighted
                      ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/40'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {layer.expanded ? (
                    <ChevronDown size={11} className="shrink-0 opacity-70" />
                  ) : (
                    <ChevronRight size={11} className="shrink-0 opacity-70" />
                  )}
                  <span className="truncate font-medium">{layer.name}</span>
                </button>

                {layer.expanded &&
                  layer.items.map((item, itemIdx) => (
                    <div
                      key={`${item.name}-${itemIdx}`}
                      className="flex items-center justify-between pl-8 pr-2 py-0.5 border-b border-slate-800/50 hover:bg-slate-800 cursor-pointer group"
                    >
                      <span className="text-slate-400 truncate group-hover:text-slate-200 transition-colors">
                        {item.name}
                      </span>
                      {item.value && (
                        <span className="text-slate-300 tabular-nums shrink-0 ml-2">
                          {item.value}
                          {item.unit && (
                            <span className="text-slate-500 ml-0.5">{item.unit}</span>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
