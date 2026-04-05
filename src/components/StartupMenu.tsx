import { useState } from 'react'
import { FolderOpen, FilePlus, ChevronRight, Clock } from 'lucide-react'

export interface Project {
  id: string
  name: string
  createdAt: string
  plansCount: number
}

interface StartupMenuProps {
  onCreateProject: (name: string) => void
  onOpenProject: (project: Project) => void
}

const SAVED_PROJECTS: Project[] = []

export default function StartupMenu({ onCreateProject, onOpenProject }: StartupMenuProps) {
  const [creating, setCreating] = useState(false)
  const [projectName, setProjectName] = useState('')

  const handleCreate = () => {
    const name = projectName.trim()
    if (!name) return
    onCreateProject(name)
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-900/50">
            <span className="text-white text-3xl font-bold">K</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100">Kutch</h1>
            <p className="text-slate-500 text-sm mt-1">Estimation de plans de construction</p>
          </div>
        </div>

        {/* Actions */}
        {!creating ? (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-4 w-full px-5 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors group text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500 group-hover:bg-indigo-400 flex items-center justify-center shrink-0 transition-colors">
                <FilePlus size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">Créer un nouveau projet</div>
                <div className="text-indigo-200 text-xs mt-0.5">Démarrer avec un projet vierge</div>
              </div>
              <ChevronRight size={16} className="text-indigo-300" />
            </button>

            <button
              onClick={() => {}}
              className="flex items-center gap-4 w-full px-5 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors group text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center shrink-0 transition-colors">
                <FolderOpen size={18} className="text-slate-300" />
              </div>
              <div className="flex-1">
                <div className="text-slate-200 font-semibold text-sm">Ouvrir un projet existant</div>
                <div className="text-slate-500 text-xs mt-0.5">Parcourir les fichiers</div>
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Nom du projet
              </label>
              <input
                autoFocus
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Ex: Projet ST12 — Bâtiment A"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-500 focus:outline-none text-slate-100 text-sm placeholder-slate-600 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setCreating(false); setProjectName('') }}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!projectName.trim()}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        )}

        {/* Recent projects */}
        {SAVED_PROJECTS.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className="text-slate-600" />
              <span className="text-slate-600 text-xs font-medium uppercase tracking-wider">Projets récents</span>
            </div>
            <div className="flex flex-col gap-1">
              {SAVED_PROJECTS.map(project => (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors text-left group"
                >
                  <div>
                    <div className="text-slate-300 text-sm font-medium group-hover:text-slate-100 transition-colors">{project.name}</div>
                    <div className="text-slate-600 text-xs mt-0.5">{project.plansCount} plan{project.plansCount !== 1 ? 's' : ''} · {project.createdAt}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
