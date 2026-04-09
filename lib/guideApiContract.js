/**
 * Generate flow: extract JSON from model text, normalize to client shape, validate completeness.
 */

import { normalizeActionsArray } from './guideStepText.js'

/** Reject legacy clarification payloads before parsing (triggers retry in api/generate + server). */
export function rawTextIndicatesClarificationResponse(text) {
  if (typeof text !== 'string' || !text.trim()) return false
  return /needsClarification/i.test(text)
}

export function omitLegacyPartialGuideFields(guide) {
  if (!guide || typeof guide !== 'object') return guide
  const next = { ...guide }
  delete next.needsClarification
  delete next.message
  delete next.questions
  return next
}

function extractBalancedJson(s) {
  const start = s.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (esc) {
      esc = false
      continue
    }
    if (inStr) {
      if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

function extractJsonObjectString(text) {
  if (typeof text !== 'string') return null
  const t = text.trim()
  if (!t) return null

  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(t)
  if (fence) {
    const inner = fence[1].trim()
    return extractBalancedJson(inner) || (inner.startsWith('{') ? inner : null)
  }

  if (t.startsWith('{')) return extractBalancedJson(t)

  const idx = t.indexOf('{')
  if (idx === -1) return null
  return extractBalancedJson(t.slice(idx))
}

export function parseGuideJsonFromText(text) {
  const jsonStr = extractJsonObjectString(text)
  if (!jsonStr) return null
  try {
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

function toPositiveInt(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const i = Math.round(n)
  if (i <= 0) return null
  return i
}

export function normalizeCostEstimate(raw) {
  if (!raw || typeof raw !== 'object') return null
  const intFields = [
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
  const out = {}
  for (const key of intFields) {
    const v = toPositiveInt(raw[key])
    if (v == null) return null
    out[key] = v
  }

  const contractorMaterialsMarkupNote = String(raw.contractorMaterialsMarkupNote || '').trim()
  const laborBasisNote = String(raw.laborBasisNote || '').trim()
  const materialsBasisNote = String(raw.materialsBasisNote || '').trim()
  if (!contractorMaterialsMarkupNote || !laborBasisNote || !materialsBasisNote) return null

  out.contractorMaterialsMarkupNote = contractorMaterialsMarkupNote
  out.laborBasisNote = laborBasisNote
  out.materialsBasisNote = materialsBasisNote
  return out
}

export function normalizeGuideShape(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (raw.outOfScope) return null

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const sum = raw.summary && typeof raw.summary === 'object' ? raw.summary : {}
  const materials = Array.isArray(sum.materials)
    ? sum.materials
    : Array.isArray(raw.materials)
      ? raw.materials
      : []
  const tools = Array.isArray(sum.tools)
    ? sum.tools
    : Array.isArray(raw.tools)
      ? raw.tools
      : []
  const assumptionsWeMade = Array.isArray(sum.assumptionsWeMade)
    ? sum.assumptionsWeMade
    : Array.isArray(raw.assumptionsWeMade)
      ? raw.assumptionsWeMade
      : []

  const stepsIn = Array.isArray(raw.steps) ? raw.steps : []
  const steps = stepsIn.map((s, i) => {
    const n = s && typeof s === 'object' ? s : {}
    const num = typeof n.number === 'number' && n.number > 0 ? n.number : i + 1
    const st = typeof n.title === 'string' ? n.title.trim() : ''
    const showVideo = typeof n.showVideo === 'boolean' ? n.showVideo : undefined

    let prelim = []
    if (Array.isArray(n.actions) && n.actions.length > 0) {
      prelim = n.actions.map((a) => String(a).trim()).filter(Boolean)
    } else if (typeof n.body === 'string' && n.body.trim()) {
      const b = n.body.trim()
      prelim = b
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
      if (prelim.length === 1 && prelim[0].includes('; ')) {
        prelim = prelim[0].split(/;\s+/).map((x) => x.trim()).filter(Boolean)
      }
    }
    const actions = normalizeActionsArray(prelim)

    const proTipRaw = typeof n.proTip === 'string' ? n.proTip.trim() : ''
    const out = { number: num, title: st, actions }
    if (proTipRaw) out.proTip = proTipRaw
    if (typeof showVideo === 'boolean') out.showVideo = showVideo
    // Never persist legacy body; UI uses actions only.
    return out
  })

  const costEstimate = normalizeCostEstimate(raw.costEstimate)

  return {
    title,
    summary: {
      materials: materials.map((m) => String(m).trim()).filter(Boolean),
      tools: tools.map((t) => String(t).trim()).filter(Boolean),
      assumptionsWeMade: assumptionsWeMade.map((a) => String(a).trim()).filter(Boolean),
    },
    steps,
    ...(costEstimate ? { costEstimate } : {}),
  }
}

export function isCompleteGuide(guide) {
  if (!guide || typeof guide !== 'object') return false
  if (!guide.title || !String(guide.title).trim()) return false
  const sum = guide.summary
  if (!sum || typeof sum !== 'object') return false
  if (!Array.isArray(sum.materials) || !Array.isArray(sum.tools) || !Array.isArray(sum.assumptionsWeMade)) {
    return false
  }
  if (sum.assumptionsWeMade.length < 1) return false
  if (!Array.isArray(guide.steps) || guide.steps.length < 5) return false
  for (const s of guide.steps) {
    if (!s || typeof s !== 'object') return false
    if (!s.title || !String(s.title).trim()) return false
    if (!Array.isArray(s.actions) || s.actions.length === 0) return false
    if (s.actions.length > 8) return false
    for (const a of s.actions) {
      if (!a || !String(a).trim()) return false
    }
    if (s.proTip != null && typeof s.proTip !== 'string') return false
    if (typeof s.showVideo !== 'boolean') return false
  }
  // Soft check only: malformed or missing costEstimate should never fail the guide.
  if (guide.costEstimate != null && normalizeCostEstimate(guide.costEstimate) == null) {
    // noop
  }
  return true
}

/** Returns a valid guide or null (malformed, incomplete, empty steps, or clarification JSON). */
export function parseCompleteGuideFromModelText(text) {
  if (rawTextIndicatesClarificationResponse(text)) return null

  const raw = parseGuideJsonFromText(text)
  if (!raw) return null
  if (raw.needsClarification === true || raw.needsClarification === 'true') return null

  const guide = normalizeGuideShape(raw)
  if (!guide) return null
  return isCompleteGuide(guide) ? guide : null
}
