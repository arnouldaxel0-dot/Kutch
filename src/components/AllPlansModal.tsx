import { X, FileText, Upload } from 'lucide-react'
import type { Plan } from '../types'

export type { Plan }

interface AllPlansModalProps {
  projectName: string
  plans: Plan[]
  activePlanId: string | null
  onSelectPlan: (plan: Plan) => void
  onClose: () => void
  onImportPdf: () => void
}

export default function AllPlansModal({
  projectName,
  plans,
  activePlanId,
  onSelectPlan,
  onClose,
  onImportPdf,
}: AllPlansModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col w-full max-w-2xl max-h-[70vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-100 font-semibold text-sm">Plans du projet</h2>
            <p className="text-slate-500 text-xs mt-0.5">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                <FileText size={24} className="text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Aucun plan importé</p>
                <p className="text-slate-600 text-xs mt-1">Importez des PDF pour commencer</p>
              </div>
              <button
                onClick={() => { onClose(); onImportPdf() }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                <Upload size={14} />
                Importer un PDF
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {plans.map(plan => {
                const isActive = plan.id === activePlanId
                return (
                  <button
                    key={plan.id}
                    onClick={() => { onSelectPlan(plan); onClose() }}
                    className={`flex flex-col gap-2 p-3 rounded-lg border text-left transition-colors ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    <div className={`w-full aspect-video rounded flex items-center justify-center ${isActive ? 'bg-indigo-900/30' : 'bg-slate-700'}`}>
                      <FileText size={20} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                    </div>
                    <span className="text-xs font-medium truncate w-full">{plan.name}</span>
                    <span className="text-xs text-slate-500">{plan.importedAt}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {plans.length > 0 && (
          <div className="flex justify-between items-center px-5 py-3 bg-slate-800 border-t border-slate-700 shrink-0">
            <span className="text-slate-500 text-xs">{plans.length} plan{plans.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => { onClose(); onImportPdf() }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <Upload size={12} />
              Importer un PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
