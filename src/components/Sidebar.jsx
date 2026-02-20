import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProjects } from '../lib/projects'

export default function Sidebar({ selectedProjectId, onSelectProject, onClose, refreshTrigger }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoadingProjects(true)
    setLoadError(false)
    getProjects(user.uid)
      .then(setProjects)
      .catch(() => setLoadError(true))
      .finally(() => setLoadingProjects(false))
  }, [user, refreshTrigger])

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4">
        <p className="min-w-0 flex-1 text-xl font-bold tracking-tight text-neutral-800">
          Saved projects
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
          aria-label="Close sidebar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden p-3">
        <div className="flex-1 overflow-y-auto">
          {loadError && !loadingProjects && (
            <p className="px-2 py-4 text-sm leading-relaxed text-neutral-500">
              No projects started yet.
            </p>
          )}
          {loadingProjects ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
            </div>
          ) : !loadError && projects.length === 0 ? (
            <p className="px-2 py-4 text-sm leading-relaxed text-neutral-500">
              No projects started yet.
            </p>
          ) : !loadError ? (
            <ul className="space-y-1">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSelectProject(p)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      selectedProjectId === p.id
                        ? 'bg-neutral-200 font-medium text-neutral-900'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <span className="line-clamp-2">{p.projectIdea}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
