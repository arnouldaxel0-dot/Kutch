import Panel from './ui/Panel'
import NavigationPanel from './panels/NavigationPanel'
import PropertiesPanel from './panels/PropertiesPanel'
import LayersPanel from './panels/LayersPanel'

interface LeftSidebarProps {
  activeLayer: string
}

export default function LeftSidebar({ activeLayer: _activeLayer }: LeftSidebarProps) {
  return (
    <div className="flex flex-col w-56 shrink-0 border-r border-slate-700 bg-slate-900 overflow-hidden">
      <Panel title="Navigation" className="shrink-0">
        <NavigationPanel />
      </Panel>

      <Panel title="Propriétés" className="flex-1 overflow-hidden">
        <PropertiesPanel />
      </Panel>

      <Panel title="Calques" className="shrink-0">
        <LayersPanel />
      </Panel>
    </div>
  )
}
