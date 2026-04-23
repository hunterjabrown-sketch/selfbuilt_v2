/**
 * Cheap Haiku call: classify a design-iteration request as dimensions / materials / structural.
 * Used to gate when the expensive Opus build-guide regeneration should fire.
 *
 * - "dimensions"  : only sizes change (height, width, depth, length, count of identical parts).
 *                   Same parts, same joints, same overall layout. Guide stays valid.
 * - "materials"   : only lumber / finish / fastener swaps. Same geometry. Guide stays valid.
 * - "structural"  : adds/removes parts, changes joint methods, changes layout or function
 *                   (e.g. "make this a half pipe instead of a quarter pipe", "add a backrest").
 *                   Guide is now stale.
 *
 * Returns { kind, requiresGuideRegen, summary } or null on any failure (non-blocking).
 */
import { ANTHROPIC_MODEL_COST_ESTIMATE } from './anthropicModels.js'

function summarizeDesign(design) {
  if (!design || typeof design !== 'object') return '(no current design)'
  const parts = Array.isArray(design.parts) ? design.parts : []
  const joins = Array.isArray(design.joins) ? design.joins : []
  const partLines = parts
    .slice(0, 40)
    .map((p) => {
      const id = p?.id || '?'
      const lumber = p?.lumber || '?'
      const size = Array.isArray(p?.size_in) ? `[${p.size_in.join(', ')}]` : '?'
      const shape = p?.shape ? ` shape=${p.shape}` : ''
      return `  - ${id}: ${lumber} size_in=${size}${shape}`
    })
    .join('\n')
  const joinSummary = joins.length
    ? `joins: ${joins.length} (methods: ${[...new Set(joins.map((j) => j?.method).filter(Boolean))].join(', ')})`
    : 'joins: 0'
  return `parts (${parts.length}):\n${partLines || '  (none)'}\n${joinSummary}`
}

export async function classifyIteration(anthropic, { projectIdea, baseDesign, iterationMessage }) {
  try {
    const designSummary = summarizeDesign(baseDesign)
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL_COST_ESTIMATE,
      max_tokens: 256,
      system:
        'You are a DIY-build change classifier. Return only a valid JSON object with no markdown, no explanation, nothing else.',
      messages: [
        {
          role: 'user',
          content: `Classify the user's iteration request into one of three kinds, based on whether the existing build guide would still be accurate.

Project: ${String(projectIdea || '').trim() || '(unspecified)'}

Current design (DSL summary):
${designSummary}

User iteration request:
"${String(iterationMessage || '').trim()}"

Categories:
- "dimensions": only size changes (taller, wider, shorter, longer, deeper). Same parts, same joints, same function. Guide still accurate.
- "materials": only lumber, finish, or fastener swaps (e.g. pine -> cedar, screws -> bolts, paint -> stain). Same geometry. Guide still accurate.
- "structural": adds or removes parts, changes the joint methods, changes overall layout, or changes the function of the build (e.g. "make this a couch instead of a bench", "add a backrest", "turn the quarter pipe into a half pipe", "split the shelf into two units"). Guide is now stale and should be regenerated.

When uncertain between dimensions+materials and structural, lean structural. requiresGuideRegen is true ONLY for "structural".

Return exactly this JSON shape:
{ "kind": "dimensions" | "materials" | "structural", "requiresGuideRegen": boolean, "summary": "one short sentence describing what changed" }`,
        },
      ],
    })

    const text = message.content.find((b) => b.type === 'text')?.text || ''
    console.log('[classifyIteration] raw:', text.slice(0, 200))

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])

    const kind = ['dimensions', 'materials', 'structural'].includes(parsed?.kind) ? parsed.kind : null
    if (!kind) return null
    const requiresGuideRegen = kind === 'structural' ? true : !!parsed?.requiresGuideRegen
    const summary = typeof parsed?.summary === 'string' ? parsed.summary : ''

    return { kind, requiresGuideRegen, summary }
  } catch (err) {
    console.error('[classifyIteration] error:', err?.message || err)
    return null
  }
}
