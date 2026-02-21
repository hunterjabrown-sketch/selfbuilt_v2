import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

const CHAT_SYSTEM_PROMPT = `You are a helpful DIY assistant for someone following a specific builder's guide. You have full context of their project and the guide (materials, tools, steps). Answer their questions about this project only—clarifying steps, suggesting alternatives, troubleshooting, or explaining terms. Keep answers concise and friendly. If they ask about something outside this project, gently steer them back. Do not output JSON; reply with plain text only.`

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
    const { projectIdea, guide, messages } = req.body || {}
    if (!projectIdea || !guide || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'projectIdea, guide, and messages (array) are required' })
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })
    }

    const summary = guide.summary || {}
    const steps = guide.steps || []
    const context = [
      `Project: ${projectIdea}`,
      'Materials: ' + (summary.materials || []).join(', '),
      'Tools: ' + (summary.tools || []).join(', '),
      'Steps:',
      ...(steps || []).map((s, i) => `  ${s.number ?? i + 1}. ${s.title || 'Step'}: ${(s.body || '').slice(0, 300)}...`),
    ].join('\n')

    const system = `${CHAT_SYSTEM_PROMPT}\n\nGuide context:\n${context}`
    const chatMessages = messages.map((m) => ({ role: m.role, content: m.content }))

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system,
      messages: chatMessages,
    })

    const text = message.content.find((b) => b.type === 'text')?.text?.trim() || "I'm not sure how to help with that. Try asking about a specific step or material from your guide."
    return res.status(200).json({ message: text })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Chat failed' })
  }
}
