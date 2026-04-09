import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProjects, deleteProject, projectDisplayTitle } from '../lib/projects'
import Step4Guide from './Step4Guide'

export default function SavedProjects({ onStartNew, experienceLevel = '' }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    getProjects(user.uid)
      .then((list) => {
        if (!cancelled) setProjects(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      if (viewing?.id === id) setViewing(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGuideUpdate = (nextGuide) => {
    setViewing((v) => {
      if (!v) return null
      setProjects((prev) => prev.map((p) => (p.id === v.id ? { ...p, guide: nextGuide } : p)))
      return { ...v, guide: nextGuide }
    })
  }

  if (viewing) {
    return (
      <section className="space-y-8">
        <button
          type="button"
          onClick={() => setViewing(null)}
          className="text-sm font-semibold text-secondary hover:text-secondary/80"
        >
          ← Back to saved list
        </button>
        <Step4Guide
          guide={viewing.guide}
          projectIdea={viewing.projectIdea}
          savedProjectId={viewing.id}
          experienceLevel={experienceLevel}
          onGuideChange={handleGuideUpdate}
          onStartOver={() => { setViewing(null); onStartNew?.() }}
        />
      </section>
    )
  }

  return (
    <section className="space-y-10">
      <div>
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">Saved projects</h2>
        <p className="mt-2 text-lg text-on-surface-variant">Your previous builder&apos;s guides.</p>
        <button type="button" onClick={onStartNew} className="sb-btn-primary mt-6 text-sm">
          New project
        </button>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-outline-variant border-t-secondary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="sb-card rounded-2xl border-dashed border-outline-variant/30 bg-surface-container-low/50 p-10 text-center text-on-surface-variant">
          No saved projects yet. Generate a guide and it will appear here.
        </div>
      ) : (
        <ul className="space-y-4">
          {projects.map((p) => (
            <li
              key={p.id}
              className="sb-card ghost-shadow flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-headline font-semibold text-primary">{projectDisplayTitle(p.projectIdea)}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'No date'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewing(p)}
                  className="rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary shadow-md shadow-secondary/20 hover:opacity-95"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
