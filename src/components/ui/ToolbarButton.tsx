import { ReactNode } from 'react'
import Tooltip from './Tooltip'

interface ToolbarButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  wide?: boolean
  children?: ReactNode
}

export default function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  wide = false,
  children,
}: ToolbarButtonProps) {
  if (wide) {
    return (
      <Tooltip text={label} position="bottom">
        <button
          onClick={onClick}
          className={`tool-btn-wide ${active ? 'text-indigo-400 bg-indigo-950 hover:bg-indigo-900' : ''}`}
        >
          {icon}
          {children}
        </button>
      </Tooltip>
    )
  }

  return (
    <Tooltip text={label} position="bottom">
      <button
        onClick={onClick}
        className={`tool-btn ${active ? 'active' : ''}`}
      >
        {icon}
      </button>
    </Tooltip>
  )
}
