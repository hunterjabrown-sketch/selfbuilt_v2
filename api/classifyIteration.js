import Anthropic from '@anthropic-ai/sdk'
import { classifyIteration } from '../lib/iterationClassifierHaiku.js'

const apiKey = process.env.ANTHROPIC_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    let body = req.body || {}
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { return res.status(400).json({ error: 'Invalid JSON body' }) }
    }
    const { projectIdea, baseDesign, iterationMessage } = body
    if (!iterationMessage || typeof iterationMessage !== 'string') {
      return res.status(400).json({ error: 'iterationMessage (string) is required' })
    }
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })

    const anthropic = new Anthropic({ apiKey })
    const result = await classifyIteration(anthropic, {
      projectIdea: projectIdea || '',
      baseDesign: baseDesign || null,
      iterationMessage,
    })

    // Non-blocking: if the classifier failed, return a safe default rather than 500ing.
    if (!result) {
      return res.status(200).json({
        kind: 'structural',
        requiresGuideRegen: true,
        summary: 'Classifier unavailable; assuming guide may be stale.',
        fallback: true,
      })
    }
    return res.status(200).json(result)
  } catch (err) {
    console.error('[api/classifyIteration]', err)
    return res.status(500).json({ error: err.message || 'classifyIteration failed' })
  }
}
