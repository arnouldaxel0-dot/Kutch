import { FileText, LayoutGrid } from 'lucide-react'
import type { Plan } from '../../types'

interface RecentPlansPanelProps {
  plans: Plan[]
  activePlanId: string | null
  onSelectPlan: (plan: Plan) => void
  onOpenAllPlans: () => void
}

export default function RecentPlansPanel({
  plans,
  activePlanId,
  onSelectPlan,
  onOpenAllPlans,
}: RecentPlansPanelProps) {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* List */}
      <div className="overflow-y-auto flex-1">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-3 gap-2 text-center">
            <FileText size={16} className="text-slate-700" />
            <p className="text-slate-600 text-xs">Aucun plan récent</p>
          </div>
        ) : (
          plans.slice(0, 8).map(plan => {
            const isActive = plan.id === activePlanId
            return (
              <button
                key={plan.id}
                onClick={() => onSelectPlan(plan)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 border-b border-slate-800 transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-600/20 border-l-2 border-l-indigo-500'
                    : 'hover:bg-slate-800 border-l-2 border-l-transparent'
                }`}
              >
                <FileText
                  size={12}
                  className={isActive ? 'text-indigo-400 shrink-0' : 'text-slate-500 shrink-0'}
                />
                <span
                  className={`text-xs truncate ${isActive ? 'text-indigo-300 font-medium' : 'text-slate-400'}`}
                  title={plan.name}
                >
                  {plan.name}
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* All plans button */}
      <button
        onClick={onOpenAllPlans}
        className="flex items-center justify-center gap-2 w-full py-2 px-3 border-t border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors shrink-0"
      >
        <LayoutGrid size={12} />
        Voir tous les plans
      </button>
    </div>
  )
}
