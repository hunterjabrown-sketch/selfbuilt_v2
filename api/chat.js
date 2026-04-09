import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_MODEL_PROJECT_CHAT } from '../lib/anthropicModels.js'
import { CHAT_EXPERT_SYSTEM_PROMPT, buildGuideContextForChat } from '../lib/aiPrompts.js'

const apiKey = process.env.ANTHROPIC_API_KEY

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

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
  }
  if (!body || typeof body !== 'object') body = {}

  try {
    const projectIdea = typeof body.projectIdea === 'string' ? body.projectIdea : ''
    const guide = body.guide && typeof body.guide === 'object' ? body.guide : { summary: {}, steps: [] }
    const messages = Array.isArray(body.messages) ? body.messages : null
    if (!messages) {
      return res.status(400).json({ error: 'messages must be an array' })
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })
    }

    const guideBlock = buildGuideContextForChat(projectIdea, guide)
    const system = `${CHAT_EXPERT_SYSTEM_PROMPT}\n\n--- GUIDE CONTEXT (authoritative for this project) ---\n${guideBlock}`

    const chatMessages = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: String(m.content) }))
    if (chatMessages.length === 0) {
      return res.status(400).json({ error: 'At least one message with role and content is required' })
    }

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL_PROJECT_CHAT,
      max_tokens: 2048,
      system,
      messages: chatMessages,
    })

    const text =
      message.content.find((b) => b.type === 'text')?.text?.trim() ||
      "I'm not sure how to help with that. Try asking about a specific step or material from your guide."
    return res.status(200).json({ message: text })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Chat failed' })
  }
}
