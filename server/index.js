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
  "title": "Short guide heading phrase",
  "summary": {
    "materials": ["item 1", "item 2", ...],
    "tools": ["tool 1", "tool 2", ...]
  },
  "steps": [
    { "number": 1, "title": "Short step title", "body": "Detailed instructions in plain language. Be specific and reassuring." },
    ...
  ]
}

Scope (smart parameters):
- We do not provide guides for anything that would require a permit (e.g. structural work, additions, major electrical/plumbing, pools, decks over a certain size, etc.). If the project would typically require a permit or licensed pro, respond with: { "outOfScope": true, "message": "One or two friendly sentences saying we focus on permit-free DIY projects and suggesting something they can do without a permit (e.g. a piece of furniture, a shelf, painting, simple repairs)." }
- IN SCOPE: Single, discrete DIY projects that don't require permits: furniture (shelf, desk, table, bed frame, planter), repairs (fix a door, patch drywall, recaulk), simple installs (floating shelf, curtain rod, basic tile backsplash), small outdoor builds (planter box, bench), painting, replacing hardware.
- If the idea is vague or huge (e.g. \"remodel my house\"), use outOfScope and suggest narrowing to one permit-free project.

Rules:
- "title" is a short, smart phrase (2–5 words) for the guide heading. Describe what they're building in a clean way. Omit if outOfScope.
- summary.materials and summary.tools are arrays of strings. List every material and tool needed. Omit or use empty arrays if outOfScope.
- steps: array of step objects. Omit or use empty array if outOfScope.
- Write in a warm, expert-but-approachable tone. Assume the user may be new to DIY.
- If photos were provided, reference what you see where relevant.
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
      guide = { title: null, summary: { materials: [], tools: [] }, steps: [{ number: 1, title: 'Instructions', body: text }] };
    }
    if (!guide.title && guide.summary) guide.title = null;
    res.json(guide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to generate guide' });
  }
});

const CHAT_SYSTEM_PROMPT = `You are a helpful DIY assistant for someone following a specific builder's guide. You have full context of their project and the guide (materials, tools, steps). Answer their questions about this project only—clarifying steps, suggesting alternatives, troubleshooting, or explaining terms. Keep answers concise and friendly. If they ask about something outside this project, gently steer them back. Do not output JSON; reply with plain text only.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { projectIdea, guide, messages } = req.body;
    if (!projectIdea || !guide || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'projectIdea, guide, and messages (array) are required' });
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
    }

    const summary = guide.summary || {};
    const steps = guide.steps || [];
    const context = [
      `Project: ${projectIdea}`,
      'Materials: ' + (summary.materials || []).join(', '),
      'Tools: ' + (summary.tools || []).join(', '),
      'Steps:',
      ...(steps || []).map((s, i) => `  ${s.number ?? i + 1}. ${s.title || 'Step'}: ${(s.body || '').slice(0, 300)}...`),
    ].join('\n');

    const system = `${CHAT_SYSTEM_PROMPT}\n\nGuide context:\n${context}`;
    const chatMessages = messages.map((m) => ({ role: m.role, content: m.content }));

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system,
      messages: chatMessages,
    });

    const text = message.content.find((b) => b.type === 'text')?.text?.trim() || "I'm not sure how to help with that. Try asking about a specific step or material from your guide.";
    res.json({ message: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
