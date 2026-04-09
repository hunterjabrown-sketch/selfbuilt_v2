/**
 * Step video eligibility: keyword candidates + experience-level filters.
 * Used after guide generation (post-process) and when rendering saved guides without flags.
 */

import { getStepInstructionText } from './guideStepText.js'

const VIDEO_KEYWORDS = [
  'cut',
  'attach',
  'drill',
  'mix',
  'level',
  'measure',
  'sand',
  'finish',
  'secure',
  'fasten',
  'assemble',
  'install',
]

/** Terms suggesting advanced or unfamiliar technique (experienced tier). */
const ADVANCED_TERMS = [
  'miter',
  'bevel',
  'compound',
  'dado',
  'rabbet',
  'mortise',
  'tenon',
  'router',
  'rip cut',
  'plunge',
  'dovetail',
  'joinery',
  'welding',
  'wet saw',
  'thinset',
  'mortar bed',
  'trowel',
]

function wordBoundaryRe(word) {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:ing|s|ed)?\\b`, 'i')
}

export function stepTextHasVideoKeyword(step) {
  const text = `${step.title || ''} ${getStepInstructionText(step)}`
  return VIDEO_KEYWORDS.some((kw) => wordBoundaryRe(kw).test(text))
}

function hasAdvancedTerm(text) {
  const t = (text || '').toLowerCase()
  return ADVANCED_TERMS.some((phrase) => t.includes(phrase.toLowerCase()))
}

/** Multi-step or long procedural body → "technique-specific / complex" for comfortable tier. */
function isComplexOrTechniqueHeavy(step) {
  const body = String(getStepInstructionText(step) || '')
  if (body.length >= 420) return true
  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0)
  if (paragraphs.length >= 3) return true
  const sentences = body.split(/[.!?]+/).filter((s) => s.trim().length > 12)
  if (sentences.length >= 4) return true
  if (/\b(then|next|after that|first,|second,|finally|before you)\b/i.test(body) && sentences.length >= 3) return true
  return hasAdvancedTerm(`${step.title || ''} ${body}`)
}

/** Short, single-focus steps (experienced: suppress as "routine"). */
function isRoutineOnly(step) {
  const body = String(getStepInstructionText(step) || '').trim()
  if (body.length > 320) return false
  if (hasAdvancedTerm(`${step.title || ''} ${body}`)) return false
  if (isComplexOrTechniqueHeavy(step)) return false
  return true
}

function experienceBucket(level) {
  const s = String(level || '').trim().toLowerCase()
  if (!s) return 'beginner'
  if (s.includes('first time') || s.includes('beginner')) return 'beginner'
  if (s.includes('some diy')) return 'some_diy'
  if (s.includes('comfortable')) return 'comfortable'
  if (s === 'experienced' || s.includes('experienced')) return 'experienced'
  return 'beginner'
}

/**
 * Whether this step should offer an async YouTube link for this experience level.
 */
export function shouldShowVideoForStep(step, experienceLevel) {
  if (!stepTextHasVideoKeyword(step)) return false
  const bucket = experienceBucket(experienceLevel)
  if (bucket === 'beginner' || bucket === 'some_diy') return true
  if (bucket === 'comfortable') {
    return isComplexOrTechniqueHeavy(step)
  }
  if (bucket === 'experienced') {
    if (isRoutineOnly(step)) return false
    return hasAdvancedTerm(`${step.title || ''} ${getStepInstructionText(step)}`) || isComplexOrTechniqueHeavy(step)
  }
  return true
}

/**
 * Returns a new guide with each step including `showVideo` boolean.
 */
export function applyShowVideoToGuide(guide, experienceLevel) {
  if (!guide || typeof guide !== 'object') return guide
  const steps = Array.isArray(guide.steps) ? guide.steps : []
  const nextSteps = steps.map((step) => ({
    ...step,
    showVideo:
      typeof step.showVideo === 'boolean'
        ? step.showVideo
        : shouldShowVideoForStep(step, experienceLevel),
  }))
  return { ...guide, steps: nextSteps }
}
