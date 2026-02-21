import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProjects, deleteProject, projectDisplayTitle } from '../lib/projects'
import Step4Guide from './Step4Guide'

export default function SavedProjects({ onStartNew }) {
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
    return () => { cancelled = true }
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

  if (viewing) {
    return (
      <section className="space-y-6">
        <button
          type="button"
          onClick={() => setViewing(null)}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          ← Back to saved list
        </button>
        <Step4Guide guide={viewing.guide} onStartOver={() => { setViewing(null); onStartNew?.() }} />
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Saved projects</h2>
        <p className="mt-1 text-neutral-600">Your previous builder’s guides.</p>
        <button
          type="button"
          onClick={onStartNew}
          className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New project
        </button>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-600">
          No saved projects yet. Generate a guide and click “Save to my projects.”
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">{projectDisplayTitle(p.projectIdea)}</p>
                <p className="text-sm text-neutral-500">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewing(p)}
                  className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
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
