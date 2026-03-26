import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProjects, deleteProject, projectDisplayTitle } from '../lib/projects'

export default function Sidebar({ selectedProjectId, onSelectProject, onDeleteProject, onClose, onNewProject, refreshTrigger, currentProject }) {
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!user) return
    setLoadingProjects(true)
    setLoadError(null)
    getProjects(user.uid)
      .then(setProjects)
      .catch((err) => setLoadError(err?.message || 'Couldn’t load projects'))
      .finally(() => setLoadingProjects(false))
  }, [user, refreshTrigger])

  const list = currentProject && !projects.some((p) => p.projectIdea === currentProject.projectIdea)
    ? [currentProject, ...projects]
    : projects

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-outline-variant/20 bg-surface-container-low">
      <div className="shrink-0 border-b border-outline-variant/20 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 font-headline text-lg font-bold tracking-tight text-primary">Saved projects</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {onNewProject && (
          <button
            type="button"
            onClick={onNewProject}
            className="mt-3 w-full rounded-xl bg-secondary py-2.5 text-sm font-bold text-on-secondary shadow-lg shadow-secondary/20 transition hover:opacity-95"
          >
            New project
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden p-3">
        <div className="flex-1 overflow-y-auto">
          {loadError && !loadingProjects && (
            <p className="px-2 py-4 text-sm leading-relaxed text-amber-800">{loadError}</p>
          )}
          {loadingProjects ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-secondary" />
            </div>
          ) : !loadError && list.length === 0 ? (
            <p className="px-2 py-4 text-sm leading-relaxed text-on-surface-variant">No projects started yet.</p>
          ) : !loadError ? (
            <ul className="space-y-1.5">
              {list.map((p) => (
                <li key={p.id} className="group flex items-center gap-1 rounded-xl bg-surface-container-high/50 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => onSelectProject(p)}
                    className={`min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      selectedProjectId === p.id
                        ? 'bg-secondary/15 font-semibold text-secondary'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span className="line-clamp-2">{projectDisplayTitle(p.projectIdea)}</span>
                  </button>
                  {p.id !== 'current' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!window.confirm('Are you sure you want to delete this project?')) return
                        deleteProject(p.id).then(() => {
                          setProjects((prev) => prev.filter((x) => x.id !== p.id))
                          onDeleteProject?.(p.id)
                        })
                      }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-on-surface-variant opacity-0 transition hover:bg-error-container/30 hover:text-error group-hover:opacity-100"
                      aria-label="Delete project"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="mt-auto shrink-0 border-t border-outline-variant/20 p-3">
          <button
            type="button"
            onClick={() => signOut()}
            className="text-left text-xs font-medium text-on-surface-variant hover:text-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
