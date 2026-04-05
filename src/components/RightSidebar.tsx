import Panel from './ui/Panel'
import GroupsPanel from './panels/GroupsPanel'
import RecentPlansPanel from './panels/RecentPlansPanel'

interface RightSidebarProps {
  activePlan: string
}

export default function RightSidebar({ activePlan }: RightSidebarProps) {
  return (
    <div className="flex flex-col w-56 shrink-0 border-l border-slate-700 bg-slate-900 overflow-hidden">
      <Panel title="Groupes" className="flex-1 overflow-hidden">
        <GroupsPanel />
      </Panel>

      <Panel title="Plans récents" className="shrink-0" contentClassName="max-h-48">
        <RecentPlansPanel activePlan={activePlan} />
      </Panel>
    </div>
  )
}
