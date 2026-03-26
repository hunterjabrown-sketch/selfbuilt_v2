import Anthropic from '@anthropic-ai/sdk'
import { GENERATE_SYSTEM_PROMPT } from '../lib/aiPrompts.js'

// API key from Vercel env — never hardcode.
const apiKey = process.env.ANTHROPIC_API_KEY

function normalizeVagueText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/([^\w\s])/g, ' ')
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasVagueSizeLanguage(value) {
  const normalized = normalizeVagueText(value)
  const tokens = normalized.split(' ').filter(Boolean)
  return tokens.some((token) => (
    ['kinda', 'kind', 'sorta', 'sort', 'pretty', 'somewhat', 'about', 'around', 'ish', 'tall', 'short', 'big', 'small', 'large', 'medium', 'normal']
      .some((keyword) => token.startsWith(keyword))
  ))
}

function maybeNeedsClarification(projectIdea, dimensions) {
  const idea = String(projectIdea || '').toLowerCase()
  const dims = String(dimensions || '').toLowerCase().trim()
  const hasNumericMeasurement = /\b\d+(\.\d+)?\s*(in|inch|inches|ft|foot|feet|cm|mm|m|")\b/i.test(dims)
  const likelyNeedsExplicitSizing = /\b(table|desk|bench|shelf|cabinet|bookcase|island|counter|vanity|workbench|console)\b/i.test(idea)

  if (!likelyNeedsExplicitSizing) return null

  if (!dims) {
    return {
      needsClarification: true,
      message: 'This project usually needs exact sizing to avoid bad cuts or awkward proportions.',
      questions: [
        'What finished height do you want?',
        'What finished width and length do you want?',
        'Any max size limits from your room or doorway?',
      ],
    }
  }

  if (hasVagueSizeLanguage(dims) && !hasNumericMeasurement) {
    return {
      needsClarification: true,
      message: 'Your sizing sounds approximate, and exact dimensions will change the cut list and hardware choices.',
      questions: [
        'Target height (in or cm)?',
        'Target width and length (in or cm)?',
        'Do you want exact dimensions or an acceptable range?',
      ],
    }
  }

  return null
}

function buildUserMessage(projectIdea, designDescription, dimensions, materialsAccess, experienceLevel, media) {
  const parts = [
    `Project idea: ${projectIdea}`,
    designDescription ? `Design description: ${designDescription}` : null,
    dimensions ? `Dimensions/space: ${dimensions}` : null,
    materialsAccess ? `Materials they have access to: ${materialsAccess}` : null,
    experienceLevel ? `Experience level: ${experienceLevel}` : null,
  ].filter(Boolean)

  const content = [{ type: 'text', text: parts.join('\n') }]

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (media && media.length) {
    for (const m of media) {
      if (m.type && m.type.startsWith('image/') && m.data) {
        const mediaType = allowedTypes.includes(m.mediaType || m.type) ? (m.mediaType || m.type) : 'image/jpeg'
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: m.data.replace(/^data:image\/\w+;base64,/, ''),
          },
        })
      }
    }
  }

  return content
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { projectIdea, designDescription, dimensions, materialsAccess, experienceLevel, media } = req.body || {}
    if (!projectIdea) {
      return res.status(400).json({ error: 'projectIdea is required' })
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })
    }

    const clarification = maybeNeedsClarification(projectIdea, dimensions)
    if (clarification) {
      return res.status(200).json(clarification)
    }

    const anthropic = new Anthropic({ apiKey })
    const content = buildUserMessage(
      projectIdea,
      designDescription,
      dimensions,
      materialsAccess,
      experienceLevel,
      media || [],
    )

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: GENERATE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const text = message.content.find((b) => b.type === 'text')?.text || '{}'
    let guide
    try {
      guide = JSON.parse(text.trim())
    } catch {
      guide = { title: null, summary: { materials: [], tools: [] }, steps: [{ number: 1, title: 'Instructions', body: text }] }
    }
    if (!guide.title && guide.summary) guide.title = null
    return res.status(200).json(guide)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Failed to generate guide' })
  }
}
