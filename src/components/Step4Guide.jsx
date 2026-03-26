import ProjectChat from './ProjectChat'

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

export default function Step4Guide({ guide, projectIdea }) {
  const summary = guide.summary || {}
  const materials = summary.materials || []
  const tools = summary.tools || []
  const steps = guide.steps || []
  const title =
    guide.title && String(guide.title).trim()
      ? `${String(guide.title).trim()} Builder guide`
      : builderGuideTitle(projectIdea)
  const handlePrint = () => {
    const key = `selfbuilt_print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const payload = {
      title,
      projectIdea: projectIdea || '',
      materials,
      tools,
      steps,
    }
    localStorage.setItem(key, JSON.stringify(payload))
    window.open(`/print-guide.html?key=${encodeURIComponent(key)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary md:text-4xl">{title}</h2>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
        >
          Print guide
        </button>
      </div>

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
        <h3 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-outline">Step-by-step instructions</h3>
        <ol className="mt-8 list-none space-y-10 pl-0">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-on-secondary shadow-md shadow-secondary/25">
                {s.number ?? i + 1}
              </span>
              <div className="min-w-0 flex-1 border-b border-outline-variant/10 pb-10 last:border-0 last:pb-0">
                {s.title && <h4 className="font-headline text-xl font-bold text-primary">{s.title}</h4>}
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-on-surface-variant">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="pt-4">
        <ProjectChat projectIdea={projectIdea} guide={guide} />
      </div>
    </section>
  )
}
