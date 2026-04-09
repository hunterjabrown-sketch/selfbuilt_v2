import { getStepInstructionText } from '../../lib/guideStepText.js'

/**
 * Collect all user-visible guide text for measurement phrase extraction.
 */
export function collectGuideText(guide) {
  if (!guide || typeof guide !== 'object') return ''
  const parts = []
  if (guide.title) parts.push(String(guide.title))
  const sum = guide.summary || {}
  ;(sum.materials || []).forEach((m) => parts.push(String(m)))
  ;(sum.tools || []).forEach((t) => parts.push(String(t)))
  ;(guide.steps || []).forEach((s) => {
    if (s.title) parts.push(String(s.title))
    const instr = getStepInstructionText(s)
    if (instr) parts.push(instr)
    if (s.proTip) parts.push(String(s.proTip))
  })
  return parts.join('\n')
}

/**
 * Find likely measurement phrases in prose (deduped, longest first for safe replacement).
 */
export function extractMeasurementPhrases(text) {
  if (!text || typeof text !== 'string') return []
  const found = new Set()
  const add = (raw) => {
    const t = String(raw).trim()
    if (t.length >= 2 && t.length <= 80) found.add(t)
  }

  const patterns = [
    /\d+\s*-\s*\d+\/\d+\s*["'″′]/g,
    /\d+\/\d+\s*(?:"|''|inches?\b|inch\b)/gi,
    /\d+(?:\.\d+)?\s*x\s*\d+(?:\.\d+)?\s*(?:"|″|''|inches?\b|inch\b|in\.(?=\s|,|\)|\.|$)|ft\b|feet\b|cm\b|mm\b)?/gi,
    /\d+(?:\.\d+)?\s*(?:"|″|''|inches?\b|inch\b)/gi,
    /\d+(?:\.\d+)?\s*in\.(?=\s|,|\)|\]|;|$)/gi,
    /\d+(?:\.\d+)?\s*(?:ft\b|feet\b|foot\b)(?=\s|,|\)|\.|$)/gi,
    /\d+(?:\.\d+)?\s*(?:cm\b|mm\b)/gi,
    /\d+(?:\.\d+)?\s*m\b(?=\s|,|\)|\.|\n)/gi,
    /\d+'\s*-?\s*\d+(?:\s*\/\s*\d+)?\s*["″']/g,
  ]

  for (const re of patterns) {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
    const r = new RegExp(re.source, flags)
    let m
    while ((m = r.exec(text)) !== null) add(m[0])
  }

  return [...found].sort((a, b) => b.length - a.length)
}

/**
 * Materials / shopping lines that are fasteners, hardware, or consumables, not project piece sizes.
 */
export function isHardwareFastenerOrConsumableLine(line) {
  const s = String(line).toLowerCase()
  if (!s.trim()) return false
  if (
    /\b(screws?|nails?|bolts?|washers?|brads?|rivets?|nuts?\b|threaded|anchors?|toggles?|molly|pins?\b|dowels?|hinges?|latches?|handles?|drawer slides?|brackets?|corner braces?|joist hangers?|hurricane ties?|straps?|clips?|fasteners?)\b/i.test(s)
  )
    return true
  if (/\b(pocket|kreg|deck screw|wood screw|trim head|cabinet screw|drywall screw|construction screw|particle board screw|sheet metal screw)\b/i.test(s))
    return true
  if (/\b(glues?|adhesive|epoxy|caulk|silicone|construction adhesive|wood glue)\b/i.test(s) && /\b(oz|ml|lb|gallon|tube|cartridge)\b/i.test(s))
    return true
  if (/\b(drill bits?|forstner|spade bits?|hole saws?|router bits?|driver bits?|bits?\s*\d)/i.test(s)) return true
  return false
}

/** Step line is only fasteners/bits, not cuts or piece dimensions (mixed cut+screw lines stay). */
function isFastenerOnlyInstructionLine(line) {
  const s = String(line).toLowerCase()
  if (!s.trim()) return false
  if (
    /\b(cut|cuts|rip|miter|plane|countertop|shelf|panel|board|plywood|lumber|frame|cabinet|stile|rail|apron|leg|post|piece|stock|length|width|depth|height|thick|face|edge|dimension|size\b)/i.test(
      s
    )
  )
    return false
  if (isHardwareFastenerOrConsumableLine(s)) return true
  if (/\b(drive|attach|fasten|pre-?drill|counterbore|countersink)\b/i.test(s) && /\b(screw|nail|bolt|brad)\b/i.test(s)) return true
  if (/\bpocket holes?\b/i.test(s) && /\b(screw|drill)\b/i.test(s)) return true
  return false
}

function filterStepBodyForDesignMeasurements(body) {
  return String(body)
    .split(/\n+/)
    .filter((line) => !isFastenerOnlyInstructionLine(line))
    .join('\n')
}

/**
 * Measurements for the panel: design / lumber / cuts only, not screws, nails, bits, or tool sizes.
 */
export function extractDesignMeasurementPhrases(guide) {
  if (!guide || typeof guide !== 'object') return []
  const found = new Set()
  const addAll = (text) => {
    extractMeasurementPhrases(text).forEach((p) => found.add(p))
  }

  if (guide.title) addAll(String(guide.title))

  for (const line of guide.summary?.materials || []) {
    if (isHardwareFastenerOrConsumableLine(line)) continue
    addAll(String(line))
  }

  // Tools list: omit (sizes here are usually tool/bit specs, not the build design)

  for (const step of guide.steps || []) {
    addAll(String(step.title || ''))
    addAll(filterStepBodyForDesignMeasurements(String(getStepInstructionText(step) || '')))
  }

  return [...found].sort((a, b) => b.length - a.length)
}

function truncate(s, max) {
  const t = String(s || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

/** Full paragraph or block containing the measurement (not a clipped sentence). */
function extractParagraphContaining(text, phrase) {
  const idx = text.indexOf(phrase)
  if (idx < 0) return ''
  const paras = text.split(/\n\s*\n/)
  for (const p of paras) {
    if (p.includes(phrase)) return p.replace(/\s+/g, ' ').trim()
  }
  const start = Math.max(0, idx - 280)
  const end = Math.min(text.length, idx + phrase.length + 320)
  return text.slice(start, end).replace(/\s+/g, ' ').trim()
}

/**
 * Rich context for labeling: whole material/tool line, or step title + body paragraph.
 */
function findRichContext(guide, phrase) {
  const title = String(guide.title || '')
  if (title.includes(phrase)) {
    return { blob: title, stepNum: null, stepTitle: '', source: 'title' }
  }

  const steps = guide.steps || []
  for (let i = 0; i < steps.length; i++) {
    const st = steps[i]
    const n = st.number ?? i + 1
    const stTitle = String(st.title || '')
    const body = String(getStepInstructionText(st) || '')
    if (stTitle.includes(phrase)) {
      return { blob: `${stTitle}. ${body.slice(0, 400)}`, stepNum: n, stepTitle: stTitle, source: 'step' }
    }
    if (body.includes(phrase)) {
      const para = extractParagraphContaining(body, phrase)
      return { blob: `${stTitle}. ${para}`, stepNum: n, stepTitle: stTitle, source: 'step' }
    }
  }

  const mats = guide.summary?.materials || []
  for (let i = 0; i < mats.length; i++) {
    const line = String(mats[i])
    if (!line.includes(phrase)) continue
    if (isHardwareFastenerOrConsumableLine(line)) continue
    return { blob: line, stepNum: null, stepTitle: '', source: 'materials' }
  }

  return { blob: '', stepNum: null, stepTitle: '', source: 'unknown' }
}

/** Text immediately before the measurement (for disambiguation when one step mentions several sizes). */
function textBeforePhrase(blob, phrase) {
  const i = String(blob).indexOf(phrase)
  if (i < 0) return ''
  return String(blob)
    .slice(Math.max(0, i - 140), i)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Intuitive build-role label from full context (keyword rules, DIY-oriented).
 * Not a sentence extract; describes what is being sized.
 */
function intuitiveBuildLabel(blob, phrase, meta) {
  const b = blob.toLowerCase()
  const p = (phrase || '').toLowerCase()
  const has = (re) => re.test(b)
  const before = textBeforePhrase(blob, phrase)
  const stepRef = meta.stepNum != null ? ` · Step ${meta.stepNum}` : ''

  // --- Tight cues from words right before the number (same step, multiple dims) ---
  if (/(posts?\s+to|4x4|4\s*x\s*4|cedar.*posts?|corner posts?)\s*$/i.test(before) || (has(/post/i) && /cut\s+\d+.*post|posts?\s+to/i.test(b)))
    return `Corner or support post height${stepRef}`

  if (/(boards?\s+to|two boards?\s+to|2 boards?\s+to|end boards?\s+to)\s*$/i.test(before) || (has(/long sides?|long side/i) && /boards?\s+to/i.test(before)))
    return `End board or short-side / cross-piece length${stepRef}`

  if (
    (has(/between|fit between|should fit|inside|inner|opening|clearance/i) && has(/long board|long rail|long side|lengthwise/i)) ||
    /(between|fit)\s+(the\s+)?long/i.test(before)
  )
    return `Inner spacing or opening (between long sides or rails)${stepRef}`

  if (
    has(/\b8\s*['′]?\s*ft\b|\b8\s+feet\b|\b96\s*inch|lengthwise|along the length|running the length|long boards?\b(?!.*between)/i) &&
    !/(boards?\s+to|two boards?\s+to)\s*$/i.test(before)
  )
    return `Long-side or lengthwise lumber length${stepRef}`

  if (has(/short side|end board|end piece|perpendicular|across the|face board|cap board/i))
    return `End piece or short-side length${stepRef}`

  if (has(/garden bed|raised bed|planter|bed frame/i)) {
    if (has(/between|inner|inside opening|should fit/i) && has(/long|rail|board/i))
      return `Interior opening or inside dimension of the bed${stepRef}`
    if (has(/post|corner|4x4/i)) return `Post or corner height${stepRef}`
    return `Overall bed or box dimension${stepRef}`
  }

  if (has(/shelf|cleat|rail|stretcher|apron/i)) return `Shelf or frame member size${stepRef}`

  if (has(/rip|resaw|cut to (width|length)|dimensional/i) && !has(/post/i))
    return `Board cut size (from cut list)${stepRef}`

  if (has(/miter|bevel|angle/i)) return `Layout or angle-related dimension${stepRef}`

  if (has(/\bdepth\b|deep\b|thick|thickness/i)) return `Depth or thickness${stepRef}`
  if (has(/\bheight\b|\btall\b|vertical|riser/i)) return `Height${stepRef}`
  if (has(/\bwidth\b|\bwide\b|overall width/i)) return `Width${stepRef}`

  if (meta.source === 'materials') return `Dimension from your materials list${stepRef}`
  if (meta.source === 'tools') return `Dimension noted with tools${stepRef}`
  if (meta.stepTitle) return `Measurement for this step (${truncate(meta.stepTitle, 34)})${stepRef}`

  return `Measurement in this guide${stepRef}`
}

/**
 * One clear line: what part of the build this number sizes (not a text excerpt).
 */
export function inferMeasurementDescription(guide, phrase) {
  if (!guide || !phrase) return 'In this guide'
  const { blob, stepNum, stepTitle, source } = findRichContext(guide, phrase)
  if (!blob.trim()) return 'In this guide'
  return intuitiveBuildLabel(blob, phrase, { stepNum, stepTitle, source })
}

/**
 * Phrases with inferred descriptions for the measurements UI (longest phrase first).
 */
export function buildMeasurementRows(guide) {
  const phrases = extractDesignMeasurementPhrases(guide)
  return phrases.map((phrase) => ({
    phrase,
    description: inferMeasurementDescription(guide, phrase),
  }))
}

/**
 * Apply string replacements throughout guide content (longest matches first).
 * Mutates a deep clone only.
 */
export function applyDimensionReplacements(guide, pairs) {
  const sorted = [...pairs]
    .filter((p) => p && typeof p.from === 'string' && p.from !== p.to && typeof p.to === 'string')
    .sort((a, b) => b.from.length - a.from.length)
  if (sorted.length === 0) return guide

  const clone = JSON.parse(JSON.stringify(guide))

  const replaceIn = (s) => {
    if (typeof s !== 'string') return s
    let out = s
    for (const { from, to } of sorted) {
      if (!from || !out.includes(from)) continue
      out = out.split(from).join(to)
    }
    return out
  }

  if (clone.title != null) clone.title = replaceIn(String(clone.title))
  if (!clone.summary) clone.summary = { materials: [], tools: [] }
  clone.summary.materials = (clone.summary.materials || []).map((m) => replaceIn(String(m)))
  clone.summary.tools = (clone.summary.tools || []).map((t) => replaceIn(String(t)))
  clone.steps = (clone.steps || []).map((step) => ({
    ...step,
    title: step.title != null ? replaceIn(String(step.title)) : step.title,
    body: step.body != null ? replaceIn(String(step.body)) : step.body,
    actions: Array.isArray(step.actions)
      ? step.actions.map((a) => (a != null ? replaceIn(String(a)) : a))
      : step.actions,
    proTip: step.proTip != null ? replaceIn(String(step.proTip)) : step.proTip,
  }))

  if (clone._client && typeof clone._client.dimensionsInput === 'string') {
    clone._client = { ...clone._client, dimensionsInput: replaceIn(clone._client.dimensionsInput) }
  }

  return clone
}

export function ensureGuideClientMeta(guide) {
  if (!guide || typeof guide !== 'object') return guide
  if (guide._client && typeof guide._client.dimensionsInput === 'string') return guide
  return {
    ...guide,
    _client: { dimensionsInput: '', ...(guide._client || {}) },
  }
}
