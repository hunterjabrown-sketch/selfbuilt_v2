import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_MODEL_GUIDE_GENERATION } from '../lib/anthropicModels.js'
import { GENERATE_SYSTEM_PROMPT, GENERATE_SYSTEM_PROMPT_RETRY } from '../lib/aiPrompts.js'
import { applyShowVideoToGuide } from '../lib/stepVideoEligibility.js'
import { omitLegacyPartialGuideFields, parseCompleteGuideFromModelText } from '../lib/guideApiContract.js'
import { fetchCostEstimateForGuide } from '../lib/costEstimateHaiku.js'

const apiKey = process.env.ANTHROPIC_API_KEY

function buildUserMessage(projectIdea, designDescription, dimensions, materialsAccess, experienceLevel, media) {
  const parts = [
    `Project idea: ${projectIdea}`,
    designDescription ? `Design description: ${designDescription}` : null,
    dimensions ? `Dimensions/space: ${dimensions}` : null,
    materialsAccess ? `Materials they have access to: ${materialsAccess}` : null,
    experienceLevel ? `Experience level: ${experienceLevel}` : null,
  ].filter(Boolean)

  const userText = parts.join('\n')
  const content = [{ type: 'text', text: userText }]

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

async function fetchAssistantText(anthropic, system, content) {
  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL_GUIDE_GENERATION,
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content }],
  })
  return message.content.find((b) => b.type === 'text')?.text || ''
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
    let body = req.body || {}
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' })
      }
    }
    const { projectIdea, designDescription, dimensions, materialsAccess, experienceLevel, media } = body
    if (!projectIdea) {
      return res.status(400).json({ error: 'projectIdea is required' })
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })
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

    let text = await fetchAssistantText(anthropic, GENERATE_SYSTEM_PROMPT, content)
    console.log('[api/generate] first Anthropic raw text (full):', text)

    let guide = parseCompleteGuideFromModelText(text)
    console.log(
      '[api/generate] first parseCompleteGuideFromModelText:',
      guide === null ? 'null' : 'guide',
    )

    if (!guide) {
      text = await fetchAssistantText(anthropic, GENERATE_SYSTEM_PROMPT_RETRY, content)
      console.log('[api/generate] retry Anthropic raw text (full):', text)

      guide = parseCompleteGuideFromModelText(text)
      console.log(
        '[api/generate] retry parseCompleteGuideFromModelText:',
        guide === null ? 'null' : 'guide',
      )
    }

    if (!guide) {
      return res.status(500).json({ error: 'Could not generate a complete guide. Try again.' })
    }

    guide = omitLegacyPartialGuideFields(guide)
    guide = applyShowVideoToGuide(guide, experienceLevel)

    const costEstimate = await fetchCostEstimateForGuide(anthropic, projectIdea, guide)
    console.log('[costEstimate] result in api/generate:', JSON.stringify(costEstimate))
    guide = { ...guide, costEstimate: costEstimate ?? null }

    return res.status(200).json(guide)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Failed to generate guide' })
  }
}
