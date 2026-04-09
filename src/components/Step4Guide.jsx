import { useCallback, useEffect, useMemo, useState } from 'react'
import { DollarSign } from 'lucide-react'
import { getStepActionLinesForDisplay } from '../../lib/guideStepText.js'
import { applyShowVideoToGuide } from '../../lib/stepVideoEligibility.js'
import MeasurementsModal from './MeasurementsModal'
import ProjectChat from './ProjectChat'

const STEP_PROGRESS_PREFIX = 'selfbuilt_step_progress_'

/** Skip duplicate "Assumptions We Made" step when we already show the summary card. */
function getInstructionSteps(steps, assumptionsWeMade) {
  const s = steps || []
  const list = Array.isArray(assumptionsWeMade) ? assumptionsWeMade : []
  if (list.length > 0 && s.length && String(s[0]?.title || '').trim() === 'Assumptions We Made') {
    return s.slice(1)
  }
  return s
}

/** Stable id for localStorage when this guide is not tied to a saved Firestore project. */
function guideStepsFingerprint(guide) {
  const steps = guide?.steps || []
  const blob = JSON.stringify(steps.map((s, i) => [s.number ?? i + 1, s.title || '']))
  let h = 2166136261
  for (let i = 0; i < blob.length; i++) {
    h ^= blob.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function storageKeyForGuide(guide, savedProjectId) {
  if (savedProjectId) return `${STEP_PROGRESS_PREFIX}saved_${savedProjectId}`
  return `${STEP_PROGRESS_PREFIX}session_${guideStepsFingerprint(guide)}`
}

/** Stroke-based ruler so it stays readable at 16px (filled paths merged into a blob). */
function IconRuler({ className }) {
  return (
    <svg
      className={`${className ?? ''} rotate-45`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2.5" y="6" width="19" height="9" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M5 15v-3M7.5 15v-2M10 15V11M12.5 15v-2M15 15v-3M17.5 15v-2M20 15V11"
      />
    </svg>
  )
}

function IconPrinter({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 2.25h12v4.5H6v-4.5zm-3 7.5h18a1.5 1.5 0 011.5 1.5v5.25a1.5 1.5 0 01-1.5 1.5h-2.25V21a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 21v-3h-2.25A1.5 1.5 0 011.5 16.5V11a1.5 1.5 0 011.5-1.5zm4.5 6.75v6h9v-6h-9z" />
    </svg>
  )
}

const guideHeaderBtnCls =
  'inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high'

function isPositiveInt(n) {
  return Number.isInteger(n) && n > 0
}

function parseCostEstimate(raw) {
  if (!raw || typeof raw !== 'object') return null
  const requiredInts = [
    'estimatedLaborHoursLow',
    'estimatedLaborHoursHigh',
    'contractorHourlyRateLow',
    'contractorHourlyRateHigh',
    'contractorLaborCostLow',
    'contractorLaborCostHigh',
    'contractorMaterialsCostLow',
    'contractorMaterialsCostHigh',
    'contractorTotalLow',
    'contractorTotalHigh',
    'yourMaterialsCostLow',
    'yourMaterialsCostHigh',
    'estimatedSavingsLow',
    'estimatedSavingsHigh',
  ]
  for (const key of requiredInts) {
    if (!isPositiveInt(raw[key])) return null
  }
  const laborBasisNote = String(raw.laborBasisNote || '').trim()
  const materialsBasisNote = String(raw.materialsBasisNote || '').trim()
  const contractorMaterialsMarkupNote = String(raw.contractorMaterialsMarkupNote || '').trim()
  if (!laborBasisNote || !materialsBasisNote || !contractorMaterialsMarkupNote) return null
  return {
    ...raw,
    laborBasisNote,
    materialsBasisNote,
    contractorMaterialsMarkupNote,
  }
}

function money(n) {
  return `$${Number(n).toLocaleString('en-US')}`
}

function CostEstimateModal({ open, onClose, estimate }) {
  if (!open || !estimate) return null
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Cost Estimate Breakdown"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="font-headline text-2xl font-bold text-primary">Cost Estimate Breakdown</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Close cost estimate"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 text-sm text-on-surface-variant">
          <section>
            <h4 className="font-semibold text-on-surface">Labor</h4>
            <p className="mt-2">
              Estimated time to complete: {estimate.estimatedLaborHoursLow} to {estimate.estimatedLaborHoursHigh} hours
            </p>
            <p>Contractor hourly rate for this type of work: {money(estimate.contractorHourlyRateLow)} to {money(estimate.contractorHourlyRateHigh)} per hour</p>
            <p>Estimated contractor labor cost: {money(estimate.contractorLaborCostLow)} to {money(estimate.contractorLaborCostHigh)}</p>
            <p className="mt-2 text-xs text-on-surface-variant/80">{estimate.laborBasisNote}</p>
          </section>

          <section>
            <h4 className="font-semibold text-on-surface">Materials</h4>
            <p className="mt-2">Materials at retail price (your cost): {money(estimate.yourMaterialsCostLow)} to {money(estimate.yourMaterialsCostHigh)}</p>
            <p>Materials with contractor markup (20 to 40 percent): {money(estimate.contractorMaterialsCostLow)} to {money(estimate.contractorMaterialsCostHigh)}</p>
            <p className="mt-2 text-xs text-on-surface-variant/80">{estimate.materialsBasisNote}</p>
          </section>

          <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">Contractor Total</p>
                <p className="mt-1 text-lg font-bold text-on-surface">{money(estimate.contractorTotalLow)} - {money(estimate.contractorTotalHigh)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant/80">Your Cost</p>
                <p className="mt-1 text-lg font-bold text-on-surface">{money(estimate.yourMaterialsCostLow)} - {money(estimate.yourMaterialsCostHigh)}</p>
              </div>
            </div>
            <p className="mt-3 text-base font-bold text-emerald-700">
              Estimated savings: {money(estimate.estimatedSavingsLow)} - {money(estimate.estimatedSavingsHigh)}
            </p>
          </section>
        </div>

        <p className="mt-5 text-xs text-on-surface-variant/80">
          Estimates are based on US national average labor rates and standard retail material prices. Actual costs vary by region, contractor, and project complexity.
        </p>
      </div>
    </div>
  )
}

function loadStepChecks(key, stepCount) {
  if (typeof window === 'undefined' || stepCount <= 0) return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return Array(stepCount).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(stepCount).fill(false)
    const out = Array(stepCount).fill(false)
    for (let i = 0; i < stepCount; i++) out[i] = !!arr[i]
    return out
  } catch {
    return Array(stepCount).fill(false)
  }
}

function titleCase(s) {
  if (!s || !s.trim()) return ''
  return s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Turn project idea into "X Builder guide" using context (e.g. "Floating TV Shelf", "Kitchen Countertop"). */
function builderGuideTitle(projectIdea) {
  if (!projectIdea || typeof projectIdea !== 'string') return "Your builder's guide"
  let t = projectIdea.trim().replace(/\s+/g, ' ').toLowerCase()
  t = t.replace(/^(i want to build|i want to make|build|building|make|making)\s+(a |an |the )?/i, '')
  t = t.replace(/^(a |an |the )/, '')
  const firstBit = t.split(/[.!?]/)[0].trim() || t
  if (!firstBit) return "Your builder's guide"

  const nextToMatch = firstBit.match(/(.+?)\s+(?:next to my|by my|for my|by the|for the)\s+(.+)/)
  if (nextToMatch) {
    const [, thing, context] = nextToMatch
    const thingTrim = thing.replace(/^(a |an |the )/, '').trim()
    if (thingTrim && context) {
      const cappedContext = titleCase(context)
      const words = thingTrim.split(/\s+/)
      if (words.length >= 2) {
        const first = titleCase(words[0])
        const rest = words
          .slice(1)
          .map((w) => titleCase(w))
          .join(' ')
        return `${first} ${cappedContext} ${rest} Builder guide`
      }
      return `${titleCase(thingTrim)} ${cappedContext} Builder guide`
    }
  }

  const inMatch = firstBit.match(/(.+?)\s+in\s+(?:my|the)\s+(.+)/)
  if (inMatch) {
    const [, thing, location] = inMatch
    const thingTrim = thing.replace(/^(a |an |the )/, '').trim()
    if (thingTrim && location) return `${titleCase(location)} ${titleCase(thingTrim)} Builder guide`.replace(/\s+/g, ' ')
  }

  const words = firstBit.split(/\s+/).slice(0, 5)
  const phrase = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return `${phrase} Builder guide`
}

function IconYouTube({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function StepVideoHint({ title, thumbnailUrl, videoUrl }) {
  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-1 flex max-w-[160px] shrink-0 flex-col gap-1.5 rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-2 transition hover:border-secondary/25 hover:bg-surface-container-high/30"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-variant/40">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : null}
      </div>
      <div className="flex min-w-0 items-start gap-1.5">
        <IconYouTube className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
        <span className="line-clamp-2 text-[11px] leading-snug text-on-surface-variant/90 group-hover:text-secondary">{title}</span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant/55">Watch on YouTube</span>
    </a>
  )
}

export default function Step4Guide({ guide, projectIdea, savedProjectId, onGuideChange, experienceLevel = '' }) {
  const summary = guide.summary || {}
  const materials = summary.materials || []
  const tools = summary.tools || []
  const assumptionsWeMade = summary.assumptionsWeMade || []
  const displayGuide = useMemo(() => applyShowVideoToGuide(guide, experienceLevel), [guide, experienceLevel])
  const instructionSteps = useMemo(
    () => getInstructionSteps(displayGuide.steps, assumptionsWeMade),
    [displayGuide.steps, assumptionsWeMade]
  )
  const progressStorageKey = useMemo(() => storageKeyForGuide(guide, savedProjectId), [guide, savedProjectId])

  const [stepDone, setStepDone] = useState(() =>
    loadStepChecks(
      storageKeyForGuide(guide, savedProjectId),
      getInstructionSteps(guide?.steps, guide?.summary?.assumptionsWeMade || []).length
    )
  )

  useEffect(() => {
    const n = instructionSteps.length
    setStepDone(loadStepChecks(progressStorageKey, n))
  }, [guide, progressStorageKey, instructionSteps])

  const toggleStep = useCallback(
    (index) => {
      setStepDone((prev) => {
        const next = [...prev]
        if (index < 0 || index >= next.length) return prev
        next[index] = !next[index]
        try {
          localStorage.setItem(progressStorageKey, JSON.stringify(next))
        } catch {
          /* quota or private mode */
        }
        return next
      })
    },
    [progressStorageKey]
  )

  const doneCount = stepDone.filter(Boolean).length
  const totalSteps = instructionSteps.length
  const [measurementsOpen, setMeasurementsOpen] = useState(false)
  const [costEstimateOpen, setCostEstimateOpen] = useState(false)
  const [stepVideos, setStepVideos] = useState({})
  const costEstimate = useMemo(() => parseCostEstimate(guide?.costEstimate), [guide?.costEstimate])

  const projectTypeForSearch = useMemo(() => {
    const t = guide?.title && String(guide.title).trim()
    if (t) return t.slice(0, 120)
    if (projectIdea && String(projectIdea).trim()) return String(projectIdea).trim().slice(0, 120)
    return 'DIY project'
  }, [guide?.title, projectIdea])

  useEffect(() => {
    const list = instructionSteps
    const ac = new AbortController()
    setStepVideos({})

    /** 11-char YouTube video id from any common watch / embed / short URL. */
    const videoIdFromUrl = (videoUrl) => {
      if (!videoUrl || typeof videoUrl !== 'string') return null
      const u = videoUrl.trim()
      let m = u.match(/[?&]v=([a-zA-Z0-9_-]{11})\b/)
      if (m) return m[1]
      m = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|$)/)
      if (m) return m[1]
      m = u.match(/youtube\.com\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})(?:\?|$)/)
      return m ? m[1] : null
    }

    const fetchVideoForStep = async (stepTitleBase, excludeIds) => {
      const params = new URLSearchParams({
        stepTitle: stepTitleBase.slice(0, 120),
        projectType: projectTypeForSearch,
        experienceLevel: experienceLevel || '',
      })
      if (excludeIds.length > 0) {
        params.set('excludeVideoIds', excludeIds.join(','))
      }
      const r = await fetch(`/api/videos/step?${params.toString()}`, { signal: ac.signal })
      return r.json()
    }

    const isAlreadyUsed = (url, id, idSet, urlSet) =>
      urlSet.has(url) || (id != null && idSet.has(id))

    ;(async () => {
      const usedVideoIds = new Set()
      const usedUrls = new Set()

      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        if (!s.showVideo) continue
        const baseTitle = (s.title || `Step ${i + 1}`).slice(0, 120)
        const titleVariants = [baseTitle, `${baseTitle} ${i + 1}`.slice(0, 120)]

        try {
          const excludeList = () => [...usedVideoIds]

          let assigned = false
          for (const titleVariant of titleVariants) {
            if (assigned) break
            const data = await fetchVideoForStep(titleVariant, excludeList())
            if (!data?.videoUrl) continue

            const url = String(data.videoUrl).trim()
            const id = videoIdFromUrl(url)

            if (isAlreadyUsed(url, id, usedVideoIds, usedUrls)) {
              continue
            }

            if (id) usedVideoIds.add(id)
            usedUrls.add(url)

            setStepVideos((prev) => ({ ...prev, [i]: data }))
            assigned = true
          }
        } catch (err) {
          if (err.name !== 'AbortError') console.error('Step video fetch failed', err)
        }
      }
    })()

    return () => ac.abort()
  }, [instructionSteps, projectTypeForSearch, experienceLevel])

  const title =
    guide.title && String(guide.title).trim()
      ? `${String(guide.title).trim()} Builder guide`
      : builderGuideTitle(projectIdea)
  const handlePrint = () => {
    const key = `selfbuilt_print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const printSteps = getInstructionSteps(guide?.steps, assumptionsWeMade).map((s) => {
      const actions = getStepActionLinesForDisplay(s)
      const { body: _omitBody, ...rest } = s
      return { ...rest, actions }
    })
    const payload = {
      title,
      projectIdea: projectIdea || '',
      materials,
      tools,
      steps: printSteps,
      assumptionsWeMade,
      dimensionsNotes: guide?._client?.dimensionsInput || '',
    }
    localStorage.setItem(key, JSON.stringify(payload))
    window.open(`/print-guide.html?key=${encodeURIComponent(key)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-4xl">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {onGuideChange && (
            <button type="button" onClick={() => setMeasurementsOpen(true)} className={guideHeaderBtnCls}>
              <IconRuler className="h-4 w-4 shrink-0 text-primary" />
              Measurements
            </button>
          )}
          <button type="button" onClick={handlePrint} className={guideHeaderBtnCls}>
            <IconPrinter className="h-4 w-4 shrink-0 text-primary" />
            Print guide
          </button>
          {costEstimate ? (
            <button type="button" onClick={() => setCostEstimateOpen(true)} className={guideHeaderBtnCls}>
              <DollarSign className="h-4 w-4 shrink-0 text-primary" />
              Cost Estimate
            </button>
          ) : null}
        </div>
      </div>

      {assumptionsWeMade.length > 0 && (
        <div className="sb-card ghost-shadow overflow-hidden rounded-[1.5rem] border-outline-variant/20">
          <div className="border-b border-outline-variant/15 bg-surface-container-low/80 px-6 py-4">
            <h3 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-secondary">Assumptions We Made</h3>
          </div>
          <div className="p-6 sm:p-8">
            <ul className="list-inside list-disc space-y-2 text-on-surface-variant marker:text-secondary">
              {assumptionsWeMade.map((line, i) => (
                <li key={i} className="pl-1">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {onGuideChange && (
        <MeasurementsModal
          isOpen={measurementsOpen}
          guide={guide}
          onClose={() => setMeasurementsOpen(false)}
          onApply={onGuideChange}
        />
      )}

      <div className="sb-card ghost-shadow overflow-hidden rounded-[1.5rem] border-outline-variant/20">
        <div className="border-b border-outline-variant/15 bg-surface-container-low/80 px-6 py-4">
          <h3 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-secondary">What you need</h3>
        </div>
        <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <h4 className="text-sm font-bold text-primary">Materials</h4>
            <ul className="mt-3 list-inside list-disc space-y-2 text-on-surface-variant marker:text-secondary">
              {materials.length ? (
                materials.map((m, i) => (
                  <li key={i} className="pl-1">
                    {m}
                  </li>
                ))
              ) : (
                <li className="list-none text-on-surface-variant/80">None listed</li>
              )}
            </ul>
            {costEstimate ? (
              <p className="mt-3 text-xs text-on-surface-variant/80">
                Estimated materials cost: {money(costEstimate.yourMaterialsCostLow)} - {money(costEstimate.yourMaterialsCostHigh)}
              </p>
            ) : null}
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary">Tools</h4>
            <ul className="mt-3 list-inside list-disc space-y-2 text-on-surface-variant marker:text-secondary">
              {tools.length ? (
                tools.map((t, i) => (
                  <li key={i} className="pl-1">
                    {t}
                  </li>
                ))
              ) : (
                <li className="list-none text-on-surface-variant/80">None listed</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-outline">Step-by-step instructions</h3>
          {totalSteps > 0 && (
            <p className="text-sm font-medium text-on-surface-variant" aria-live="polite">
              {doneCount} of {totalSteps} steps done
            </p>
          )}
        </div>
        <ol className="mt-8 list-none space-y-10 pl-0">
          {instructionSteps.map((s, i) => {
            const checked = !!stepDone[i]
            const actionLines = getStepActionLinesForDisplay(s)
            return (
              <li key={i} className="flex gap-4 sm:gap-5">
                <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
                  <label className="flex h-11 w-11 cursor-pointer items-center justify-center">
                    <span className="sr-only">Mark step {i + 1} complete</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStep(i)}
                      className="sb-step-checkbox"
                    />
                  </label>
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      checked
                        ? 'bg-surface-variant text-on-surface-variant ring-1 ring-outline-variant/50'
                        : 'bg-secondary text-on-secondary shadow-md shadow-secondary/25'
                    }`}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1 border-b border-outline-variant/10 pb-10 last:border-0 last:pb-0">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                    <div className="min-w-0 flex-1">
                      {s.title && (
                        <h4
                          className={`font-headline text-xl font-bold ${checked ? 'text-on-surface-variant' : 'text-primary'}`}
                        >
                          {s.title}
                        </h4>
                      )}
                      {actionLines.length > 0 ? (
                        <ol className="mt-3 list-decimal space-y-2 pl-5 text-on-surface-variant marker:text-secondary">
                          {actionLines.map((line, j) => (
                            <li key={j} className="leading-relaxed pl-1">
                              {line}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-3 text-sm text-on-surface-variant/80">No actions listed for this step.</p>
                      )}
                      {s.proTip && String(s.proTip).trim() ? (
                        <p className="mt-4 border-l-4 border-secondary/40 pl-4 text-sm text-on-surface-variant/95">
                          <span className="font-semibold text-secondary">Pro tip:</span> {String(s.proTip).trim()}
                        </p>
                      ) : null}
                    </div>
                    {stepVideos[i] ? (
                      <aside className="shrink-0 lg:pt-0">
                        <StepVideoHint
                          title={stepVideos[i].title}
                          thumbnailUrl={stepVideos[i].thumbnailUrl}
                          videoUrl={stepVideos[i].videoUrl}
                        />
                      </aside>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="pt-4">
        <ProjectChat projectIdea={projectIdea} guide={guide} />
      </div>
      <CostEstimateModal open={costEstimateOpen} onClose={() => setCostEstimateOpen(false)} estimate={costEstimate} />
    </section>
  )
}
