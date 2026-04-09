/**
 * Instruction text for a step: prefers actions[] (new schema), falls back to body (legacy).
 * Expands stuffed multi-sentence strings into multiple action lines for UI and storage.
 */

/** After two letters (avoids "1. Measure" and "2.5 in." false splits), period + space + capital starts next sentence. */
const SENTENCE_BREAK = /(?<=[a-zA-Z][a-zA-Z])\.\s+(?=[A-Z"])/

/**
 * Split one model line into separate action sentences when the model crammed several into one string.
 * @param {string} line
 * @returns {string[]}
 */
function splitOneRawActionLine(line) {
  const t = String(line || '').trim()
  if (!t) return []

  if (t.includes('; ')) {
    const bits = t.split(/;\s+/).map((x) => x.trim()).filter(Boolean)
    if (bits.length > 1) {
      return bits.flatMap((b) => splitOneRawActionLineWithoutSemicolons(b))
    }
  }

  return splitOneRawActionLineWithoutSemicolons(t)
}

function splitOneRawActionLineWithoutSemicolons(t) {
  const lead = /^\d+\.\s+/.exec(t)
  const pre = lead ? lead[0] : ''
  const rest = lead ? t.slice(pre.length) : t

  if (!SENTENCE_BREAK.test(rest)) {
    return [t]
  }

  const parts = rest
    .split(SENTENCE_BREAK)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length <= 1) {
    return [t]
  }

  return parts.map((p, i) => (i === 0 && pre ? pre + p : p))
}

const MAX_ACTIONS_PER_STEP = 8

/**
 * Flatten stuffed action strings into at most MAX_ACTIONS_PER_STEP single-sentence lines.
 * @param {string[]} rawLines
 * @returns {string[]}
 */
export function normalizeActionsArray(rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) return []
  const out = []
  for (const line of rawLines) {
    for (const chunk of splitOneRawActionLine(line)) {
      const piece = String(chunk).trim()
      if (!piece) continue
      if (out.length >= MAX_ACTIONS_PER_STEP) return out
      out.push(piece)
    }
    if (out.length >= MAX_ACTIONS_PER_STEP) return out
  }
  return out
}

/**
 * Lines to render for a step (client or print): actions first, then legacy body.
 * @param {object} step
 * @returns {string[]}
 */
export function getStepActionLinesForDisplay(step) {
  if (!step || typeof step !== 'object') return []

  let prelim = []
  if (Array.isArray(step.actions) && step.actions.length > 0) {
    prelim = step.actions.map((a) => String(a).trim()).filter(Boolean)
  } else if (typeof step.body === 'string' && step.body.trim()) {
    const b = step.body.trim()
    prelim = b
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (prelim.length === 1 && prelim[0].includes('; ')) {
      prelim = prelim[0].split(/;\s+/).map((x) => x.trim()).filter(Boolean)
    }
  }

  return normalizeActionsArray(prelim)
}

export function getStepInstructionText(step) {
  if (!step || typeof step !== 'object') return ''
  const lines = getStepActionLinesForDisplay(step)
  if (lines.length) return lines.join('\n')
  return String(step.body || '').trim()
}
