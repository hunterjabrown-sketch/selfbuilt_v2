/**
 * Salvage a renderable guide from model output when JSON is partial or steps are missing.
 */

function tryParseJsonLoose(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  let t = text
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  try {
    return JSON.parse(t)
  } catch {
    const start = t.indexOf('{')
    const end = t.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1))
      } catch {
        /* fall through */
      }
    }
  }
  return null
}

function ensureSummary(obj) {
  const s = obj.summary && typeof obj.summary === 'object' ? { ...obj.summary } : {}
  if (!Array.isArray(s.materials)) s.materials = []
  if (!Array.isArray(s.tools)) s.tools = []
  if (!Array.isArray(s.assumptionsWeMade) || s.assumptionsWeMade.length === 0) {
    s.assumptionsWeMade = ['Details were expanded from the model output so you still have a usable plan — verify measurements before cutting.']
  }
  return s
}

function coerceStepsArray(steps) {
  if (Array.isArray(steps)) return steps.filter(Boolean)
  if (steps && typeof steps === 'object') return Object.values(steps)
  return []
}

function splitTextIntoSteps(body, minSteps = 1) {
  const b = String(body || '').trim()
  if (!b) return []
  const chunks = b.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)
  if (chunks.length >= minSteps) {
    return chunks.map((bodyText, i) => ({
      number: i + 1,
      title: `Step ${i + 1}`,
      body: bodyText,
    }))
  }
  return [{ number: 1, title: 'Instructions', body: b }]
}

/**
 * @returns {object|null} guide object or null if completely unusable
 */
export function normalizeGuideFromModelOutput(rawText, parsed) {
  const text = String(rawText || '').trim()
  let obj = parsed && typeof parsed === 'object' ? parsed : null
  if (!obj || Object.keys(obj).length === 0) {
    obj = tryParseJsonLoose(text)
  }
  if (!obj || typeof obj !== 'object') {
    if (text.length > 120) {
      return {
        title: 'Your builder guide',
        summary: ensureSummary({}),
        steps: splitTextIntoSteps(text, 1),
      }
    }
    return null
  }
  if (obj.outOfScope) return obj

  let steps = coerceStepsArray(obj.steps)

  if (steps.length === 0) {
    if (typeof obj.instructions === 'string' && obj.instructions.trim()) {
      steps = splitTextIntoSteps(obj.instructions, 1)
    } else if (typeof obj.content === 'string' && obj.content.trim()) {
      steps = splitTextIntoSteps(obj.content, 1)
    } else if (typeof obj.body === 'string' && obj.body.trim() && !obj.title) {
      steps = splitTextIntoSteps(obj.body, 1)
    } else if (text.length > 120) {
      steps = splitTextIntoSteps(text, 1)
    }
  }

  steps = steps.map((s, i) => ({
    number: typeof s.number === 'number' ? s.number : i + 1,
    title: String(s.title || `Step ${i + 1}`).trim() || `Step ${i + 1}`,
    body: String(s.body || s.text || '').trim() || '(See project notes.)',
  }))

  if (steps.length === 0) {
    return null
  }

  steps = padStepsToMinimumFive(steps)

  const title = obj.title && String(obj.title).trim() ? String(obj.title).trim() : 'Your builder guide'
  return {
    ...obj,
    title,
    summary: ensureSummary(obj),
    steps,
  }
}

const MIN_NUMBERED_STEPS = 5
const STEP_PAD = [
  { title: 'Measure and dry-fit', body: 'Confirm dimensions against your space. Dry-fit assemblies before glue or permanent fasteners.' },
  { title: 'Check level and square', body: 'Use a level and square on critical joints so later steps stay true.' },
  { title: 'Final inspection', body: 'Walk through the build: tight joints, correct hardware seating, and safe clearances before use.' },
]

/** If we salvaged fewer than five steps from the model, pad so the UI always has a full-looking plan. */
function padStepsToMinimumFive(steps) {
  if (steps.length >= MIN_NUMBERED_STEPS) {
    return steps.map((s, i) => ({ ...s, number: i + 1 }))
  }
  const out = steps.map((s, i) => ({ ...s, number: i + 1 }))
  let padIdx = 0
  while (out.length < MIN_NUMBERED_STEPS) {
    const p = STEP_PAD[padIdx % STEP_PAD.length]
    out.push({
      number: out.length + 1,
      title: `${p.title} (${out.length + 1})`,
      body: p.body,
    })
    padIdx += 1
  }
  return out.map((s, i) => ({ ...s, number: i + 1 }))
}

/** True only when we cannot show any steps or text to the user. */
export function isGuideCompletelyUnusable(guide) {
  if (!guide || typeof guide !== 'object') return true
  if (guide.outOfScope) return false
  const steps = guide.steps
  if (!Array.isArray(steps) || steps.length === 0) return true
  const anyBody = steps.some((s) => String(s?.body || s?.text || '').trim().length > 0)
  return !anyBody
}
