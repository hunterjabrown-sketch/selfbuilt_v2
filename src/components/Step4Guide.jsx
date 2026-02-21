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

  // "X next to my Y" / "X by the Y" → "Floating TV Shelf" (thing = floating shelf, context = tv)
  const nextToMatch = firstBit.match(/(.+?)\s+(?:next to my|by my|for my|by the|for the)\s+(.+)/)
  if (nextToMatch) {
    const [, thing, context] = nextToMatch
    const thingTrim = thing.replace(/^(a |an |the )/, '').trim()
    if (thingTrim && context) {
      const cappedContext = titleCase(context)
      const words = thingTrim.split(/\s+/)
      if (words.length >= 2) {
        const first = titleCase(words[0])
        const rest = words.slice(1).map((w) => titleCase(w)).join(' ')
        return `${first} ${cappedContext} ${rest} Builder guide`
      }
      return `${titleCase(thingTrim)} ${cappedContext} Builder guide`
    }
  }

  // "X in my Y" / "X in the Y" → "Kitchen Countertop" (location first)
  const inMatch = firstBit.match(/(.+?)\s+in\s+(?:my|the)\s+(.+)/)
  if (inMatch) {
    const [, thing, location] = inMatch
    const thingTrim = thing.replace(/^(a |an |the )/, '').trim()
    if (thingTrim && location) return `${titleCase(location)} ${titleCase(thingTrim)} Builder guide`.replace(/\s+/g, ' ')
  }

  // No clear pattern: title-case the whole phrase (first 5 words max to avoid run-on)
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

  return (
    <section className="space-y-10">
      <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>

      {/* Summary box — materials & tools */}
      <div className="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">What you need</h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-neutral-700">Materials</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-800">
              {materials.length ? materials.map((m, i) => <li key={i}>{m}</li>) : <li className="list-none text-neutral-500">—</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-700">Tools</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-800">
              {tools.length ? tools.map((t, i) => <li key={i}>{t}</li>) : <li className="list-none text-neutral-500">—</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Numbered steps */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Step-by-step instructions</h3>
        <ol className="mt-6 list-none space-y-8 pl-0">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                {s.number ?? i + 1}
              </span>
              <div className="min-w-0 flex-1">
                {s.title && <h4 className="text-lg font-semibold text-neutral-900">{s.title}</h4>}
                <p className="mt-2 whitespace-pre-wrap text-neutral-700 leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="pt-6">
        <ProjectChat projectIdea={projectIdea} guide={guide} />
      </div>
    </section>
  )
}
