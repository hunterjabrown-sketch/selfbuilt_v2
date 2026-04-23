import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProjects, deleteProject, projectDisplayTitle } from '../lib/projects'
import { ImageOff, ListChecks, Loader2, Trash2 } from 'lucide-react'
import Step4Guide from './Step4Guide'

function formatDate(d) {
  if (!d) return ''
  try {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function designSummaryText(project) {
  const g = project.guide
  if (!g || typeof g !== 'object') {
    const idea = project.projectIdea ? String(project.projectIdea).trim() : ''
    return {
      title: 'Design',
      body: idea || 'No design details saved yet.',
    }
  }
  const title = (g.title && String(g.title).trim()) || projectDisplayTitle(project.projectIdea)
  const desc =
    (g.description && String(g.description).trim()) ||
    (g.summary?.assumptionsWeMade && g.summary.assumptionsWeMade[0]) ||
    ''
  const oneLine = desc.length > 180 ? desc.slice(0, 178) + '…' : desc
  return { title, body: oneLine }
}

function stepCount(guide) {
  const steps = guide?.steps
  if (!Array.isArray(steps)) return 0
  return steps.length
}

/**
 * Kept exported for backwards compatibility with any callers that still
 * reference it; the main page below now renders Step4Guide inline instead of
 * popping this modal.
 */
export function GuideDetailModal({ project, open, onClose }) {
  if (!open || !project) return null
  const g = project.guide
  const title =
    (g?.title && String(g.title).trim()) || projectDisplayTitle(project.projectIdea) || 'Builder guide'
  const description = (g?.description && String(g.description).trim()) || ''
  const steps = Array.isArray(g?.steps) ? g.steps : []

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-primary/40 backdrop-blur-[2px]" aria-hidden onClick={onClose} />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <div
          className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl"
          role="dialog"
          aria-modal="true"
        >
          <div className="shrink-0 border-b border-outline-variant/15 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-headline text-lg font-bold text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-high"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            {description ? <p className="mt-2 text-sm text-on-surface-variant">{description}</p> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {steps.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No step list stored for this project.</p>
            ) : (
              <ol className="list-decimal space-y-3 pl-4 text-sm text-on-surface">
                {steps.map((s, i) => (
                  <li key={i} className="pl-1 marker:font-bold marker:text-secondary">
                    <span className="font-semibold text-on-surface">
                      {s.title || `Step ${s.number ?? i + 1}`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function SavedProjectsPage({ refreshTrigger = 0, experienceLevel = '' }) {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  /** When non-null, the list is hidden and Step4Guide is rendered inline. */
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getProjects(user.uid)
      .then((rows) => {
        if (!cancelled) setList(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load projects')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, refreshTrigger])

  /** Mirror Step4Guide's guide-mutation callback back onto the local list
   *  so a fresh thumbnail/step edit from inside the guide shows up immediately
   *  when the user navigates back to the saved list. */
  const handleGuideUpdate = (nextGuide) => {
    setViewing((v) => {
      if (!v) return null
      setList((prev) => prev.map((p) => (p.id === v.id ? { ...p, guide: nextGuide } : p)))
      return { ...v, guide: nextGuide }
    })
  }

  if (viewing) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => setViewing(null)}
          className="mb-6 text-sm font-semibold text-secondary hover:text-secondary/80"
        >
          ← Back to saved list
        </button>
        <Step4Guide
          guide={viewing.guide}
          projectIdea={viewing.projectIdea}
          savedProjectId={viewing.id}
          experienceLevel={experienceLevel}
          onGuideChange={handleGuideUpdate}
          onStartOver={() => setViewing(null)}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" strokeWidth={2} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-on-surface">No saved projects yet</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          When you generate a full builder guide from the app, it can appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Saved projects</h1>
      <p className="mt-1 text-sm text-on-surface-variant">Your guides from the cloud, newest first.</p>
      <ul className="mt-8 space-y-4">
        {list.map((p) => {
          const { title, body } = designSummaryText(p)
          const nSteps = stepCount(p.guide)
          return (
            <li
              key={p.id}
              className="grid grid-cols-1 items-start gap-4 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest/80 p-4 shadow-sm sm:grid-cols-12"
            >
              <div className="sm:col-span-2">
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-high">
                  {p.thumbnailDataUrl ? (
                    <img
                      src={p.thumbnailDataUrl}
                      alt={`Design preview for ${projectDisplayTitle(p.projectIdea)}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-on-surface-variant/60">
                      <ImageOff className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                  )}
                </div>
              </div>
              <div className="sm:col-span-3">
                <p className="font-headline text-base font-bold leading-snug text-primary">
                  {projectDisplayTitle(p.projectIdea)}
                </p>
                {formatDate(p.createdAt) ? (
                  <p className="mt-1 text-xs text-on-surface-variant">{formatDate(p.createdAt)}</p>
                ) : null}
              </div>
              <div className="min-w-0 sm:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary/90">Design</p>
                <p className="mt-0.5 font-medium text-on-surface">{title}</p>
                {body ? <p className="mt-1.5 line-clamp-3 text-sm text-on-surface-variant">{body}</p> : null}
                {nSteps > 0 ? (
                  <p className="mt-2 text-xs text-on-surface-variant">{nSteps} steps in guide</p>
                ) : null}
              </div>
              <div className="flex flex-row items-center justify-end gap-2 sm:col-span-2 sm:flex-col sm:items-end">
                <button
                  type="button"
                  onClick={() => setViewing(p)}
                  className="inline-flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary hover:bg-secondary/20"
                  title="Open builder guide"
                  aria-label="Open builder guide"
                >
                  <ListChecks className="h-5 w-5" strokeWidth={2.25} />
                  <span>Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('Delete this saved project?')) return
                    deleteProject(p.id).then(() => setList((prev) => prev.filter((x) => x.id !== p.id)))
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-error"
                  title="Delete"
                  aria-label="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
