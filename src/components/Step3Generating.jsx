import { useEffect, useMemo, useRef, useState } from 'react'

function simulatedProgressFromElapsed(ms) {
  if (ms <= 2000) return (ms / 2000) * 15
  if (ms <= 8000) return 15 + ((ms - 2000) / 6000) * 25
  if (ms <= 20000) return 40 + ((ms - 8000) / 12000) * 25
  if (ms <= 40000) return 65 + ((ms - 20000) / 20000) * 17
  if (ms <= 60000) return 82 + ((ms - 40000) / 20000) * 10
  return 92
}

function stageMessage(progress) {
  if (progress < 20) return 'Reading your project idea...'
  if (progress < 40) return 'Planning your materials and tools...'
  if (progress < 60) return 'Sequencing your build steps...'
  if (progress < 80) return 'Adding pro tips and safety notes...'
  if (progress < 95) return 'Almost ready, finishing up...'
  return 'Building your guide...'
}

function remainingText(progress) {
  if (progress >= 95) return 'Finishing up...'
  if (progress >= 90) return 'Almost done...'
  const seconds = Math.round(((100 - progress) / 100) * 50)
  if (seconds < 5) return 'Almost done...'
  return `About ${seconds} seconds remaining`
}

export default function Step3Generating({ generationStatus = 'running', generationError = '', onComplete, onBack }) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(0)
  const mountedRef = useRef(true)
  const completeStartedRef = useRef(false)
  const startedAtRef = useRef(performance.now())

  useEffect(() => {
    mountedRef.current = true
    startedAtRef.current = performance.now()
    setProgress(0)
    completeStartedRef.current = false

    const tick = (now) => {
      if (!mountedRef.current) return
      if (generationStatus === 'running') {
        const elapsed = now - startedAtRef.current
        const target = simulatedProgressFromElapsed(elapsed)
        setProgress((prev) => Math.min(92, Math.max(prev, prev + (target - prev) * 0.2)))
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      mountedRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [generationStatus])

  useEffect(() => {
    if (generationStatus !== 'success' || completeStartedRef.current) return
    completeStartedRef.current = true
    const start = performance.now()
    const startProgress = progress

    const animateToDone = (now) => {
      if (!mountedRef.current) return
      const t = Math.min(1, (now - start) / 600)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = startProgress + (100 - startProgress) * eased
      setProgress(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animateToDone)
      } else {
        onComplete?.()
      }
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animateToDone)
  }, [generationStatus, progress, onComplete])

  const roundedProgress = useMemo(() => Math.round(progress), [progress])
  const message = stageMessage(roundedProgress)
  const eta = remainingText(roundedProgress)

  return (
    <section className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-outline-variant border-t-secondary" />
      <h2 className="mt-8 font-headline text-2xl font-extrabold text-primary">Building your guide</h2>
      <p className="mt-3 max-w-md text-lg text-on-surface-variant">
        Analyzing your project and space to create a step-by-step builder&apos;s guide.
      </p>
      <p className="mt-6 text-sm font-semibold text-on-surface">{message}</p>
      <div className="mt-3 w-full max-w-xl">
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-100"
              style={{ width: `${Math.max(0, Math.min(100, roundedProgress))}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm font-semibold text-on-surface">{roundedProgress}%</span>
        </div>
        <p className="mt-2 text-sm text-on-surface-variant">{eta}</p>
      </div>
      {generationStatus === 'error' && generationError ? (
        <div className="mt-6 max-w-xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
          <p>{generationError}</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 rounded-lg bg-amber-200 px-3 py-1.5 font-semibold hover:bg-amber-300"
          >
            Back to details
          </button>
        </div>
      ) : null}
    </section>
  )
}
