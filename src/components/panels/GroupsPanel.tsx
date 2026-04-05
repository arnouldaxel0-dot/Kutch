export default function GroupsPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 gap-3 text-center px-4">
      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <p className="text-slate-600 text-xs leading-relaxed">
        Les groupes apparaîtront ici après avoir importé et annoté un plan.
      </p>
    </div>
  )
}
