import { FileText } from 'lucide-react'

interface RecentPlan {
  name: string
  active?: boolean
}

const RECENT_PLANS: RecentPlan[] = [
  { name: '3_ST13-PHRDC' },
  { name: 'HGA_ST_GERMAIN_DCE_PLN_102_2205201' },
  { name: 'HGA_ST_GERMAIN_DCE_PLN_106_2205201' },
  { name: 'HGA_ST_GERMAIN_DCE_PLN_107_220520' },
  { name: 'HGA_ST_GERMAIN_DCE_PLN_100_220520' },
  { name: '1_ST11-Plan fondation' },
  { name: "Plan d'installation de chantier - 4" },
  { name: 'HGA_ST_GERMAIN_DCE_PLN_101_2205201' },
  { name: '2_ST12-PH5S1', active: true },
]

interface RecentPlansPanelProps {
  activePlan: string
}

export default function RecentPlansPanel({ activePlan }: RecentPlansPanelProps) {
  return (
    <div className="overflow-y-auto bg-slate-900 flex-1">
      {RECENT_PLANS.map((plan, idx) => {
        const isActive = plan.name === activePlan || plan.active
        return (
          <div
            key={`${plan.name}-${idx}`}
            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-slate-800 transition-colors ${
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
              className={`text-xs truncate ${
                isActive ? 'text-indigo-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={plan.name}
            >
              {plan.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
