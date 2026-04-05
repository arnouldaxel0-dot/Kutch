import Panel from './ui/Panel'
import GroupsPanel from './panels/GroupsPanel'
import RecentPlansPanel from './panels/RecentPlansPanel'
import type { Plan } from './AllPlansModal'

interface RightSidebarProps {
  plans: Plan[]
  activePlanId: string | null
  onSelectPlan: (plan: Plan) => void
  onOpenAllPlans: () => void
}

export default function RightSidebar({ plans, activePlanId, onSelectPlan, onOpenAllPlans }: RightSidebarProps) {
  return (
    <div className="flex flex-col w-56 shrink-0 border-l border-slate-700 bg-slate-900 overflow-hidden">
      <Panel title="Groupes" className="flex-1 overflow-hidden">
        <GroupsPanel />
      </Panel>

      <Panel title="Plans récents" className="shrink-0" contentClassName="flex flex-col">
        <RecentPlansPanel
          plans={plans}
          activePlanId={activePlanId}
          onSelectPlan={onSelectPlan}
          onOpenAllPlans={onOpenAllPlans}
        />
      </Panel>
    </div>
  )
}
