import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

// API key must come from .env only — never hardcode ANTHROPIC_API_KEY.
const apiKey = process.env.ANTHROPIC_API_KEY;

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const anthropic = new Anthropic({ apiKey });

const SYSTEM_PROMPT = `You are a knowledgeable, friendly contractor helping a DIYer with a home improvement project. You give clear, confidence-building advice in plain language—like talking to a first-time DIYer.

When you receive project details and optionally photos of the space, you must respond with a single JSON object (no markdown, no code fences) in this exact shape:

{
  "summary": {
    "materials": ["item 1", "item 2", ...],
    "tools": ["tool 1", "tool 2", ...]
  },
  "steps": [
    { "number": 1, "title": "Short step title", "body": "Detailed instructions in plain language. Be specific and reassuring." },
    ...
  ]
}

Rules:
- summary.materials and summary.tools are arrays of strings. List every material and tool needed.
- steps is an array of objects with number (integer), title (string), body (string). Each step should be clear, detailed, and actionable.
- Write in a warm, expert-but-approachable tone. Assume the user may be new to DIY.
- If photos were provided, reference what you see (e.g., "Based on your space..." or "Your wall looks like...") where relevant.
- Output only the JSON object, no other text.`;

function buildUserMessage(projectIdea, dimensions, materialsAccess, experienceLevel, media) {
  const parts = [
    `Project idea: ${projectIdea}`,
    dimensions ? `Dimensions/space: ${dimensions}` : null,
    materialsAccess ? `Materials they have access to: ${materialsAccess}` : null,
    experienceLevel ? `Experience level: ${experienceLevel}` : null,
  ].filter(Boolean);

  const content = [{ type: 'text', text: parts.join('\n') }];

  // Add image blocks for vision (Claude: jpeg, png, gif, webp only)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (media && media.length) {
    for (const m of media) {
      if (m.type && m.type.startsWith('image/') && m.data) {
        const mediaType = allowedTypes.includes(m.mediaType || m.type) ? (m.mediaType || m.type) : 'image/jpeg';
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: m.data.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }
    }
  }

  return content;
}

app.post('/api/generate', async (req, res) => {
  try {
    const { projectIdea, dimensions, materialsAccess, experienceLevel, media } = req.body;
    if (!projectIdea) {
      return res.status(400).json({ error: 'projectIdea is required' });
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
    }

    const content = buildUserMessage(projectIdea, dimensions, materialsAccess, experienceLevel, media || []);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '{}';
    let guide;
    try {
      guide = JSON.parse(text.trim());
    } catch {
      guide = { summary: { materials: [], tools: [] }, steps: [{ number: 1, title: 'Instructions', body: text }] };
    }
    res.json(guide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to generate guide' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
