/**
 * Anthropic model ids — keep in sync across Express and Vercel.
 * Guide generation uses Opus; Project Assistant chat uses Sonnet.
 * YouTube step search queries use Haiku.
 */
export const ANTHROPIC_MODEL_GUIDE_GENERATION = 'claude-opus-4-6'
export const ANTHROPIC_MODEL_PROJECT_CHAT = 'claude-sonnet-4-6'
export const ANTHROPIC_MODEL_YOUTUBE_QUERY = 'claude-haiku-4-5-20251001'
/** Post-guide cost estimate (same Haiku build as YouTube query synthesis). */
export const ANTHROPIC_MODEL_COST_ESTIMATE = 'claude-haiku-4-5-20251001'
