import { ReactNode, CSSProperties } from 'react'

interface PanelProps {
  title: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  contentClassName?: string
  style?: CSSProperties
}

export default function Panel({
  title,
  children,
  actions,
  className = '',
  contentClassName = '',
  style,
}: PanelProps) {
  return (
    <div className={`flex flex-col border-b border-slate-700 ${className}`} style={style}>
      <div className="panel-header">
        <span>{title}</span>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className={`flex-1 overflow-y-auto ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}
