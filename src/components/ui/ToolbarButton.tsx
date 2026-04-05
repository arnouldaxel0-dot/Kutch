import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import Tooltip from './Tooltip'

interface ToolbarButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  onArrowClick?: () => void
  active?: boolean
}

export default function ToolbarButton({
  icon,
  label,
  onClick,
  onArrowClick,
  active = false,
}: ToolbarButtonProps) {
  return (
    <Tooltip text={label} position="bottom">
      <div
        className={`flex items-center rounded overflow-hidden border transition-all duration-150 ${
          active
            ? 'border-indigo-500/60 bg-indigo-950 text-indigo-400'
            : 'border-transparent hover:border-slate-600 hover:bg-slate-700 text-slate-400 hover:text-slate-100'
        }`}
      >
        {/* Main action */}
        <button
          onClick={onClick}
          className="flex items-center justify-center w-7 h-7 shrink-0"
        >
          {icon}
        </button>

        {/* Dropdown arrow */}
        <button
          onClick={e => { e.stopPropagation(); onArrowClick?.() }}
          className={`flex items-center justify-center w-4 h-7 border-l shrink-0 transition-colors ${
            active
              ? 'border-indigo-500/40 hover:bg-indigo-900 text-indigo-500 hover:text-indigo-300'
              : 'border-slate-600/0 group-hover:border-slate-600 hover:bg-slate-600 text-slate-600 hover:text-slate-300'
          }`}
        >
          <ChevronDown size={10} />
        </button>
      </div>
    </Tooltip>
  )
}
