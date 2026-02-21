import Anthropic from '@anthropic-ai/sdk';

// API key from Vercel env — never hardcode.
const apiKey = process.env.ANTHROPIC_API_KEY;

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectIdea, dimensions, materialsAccess, experienceLevel, media } = req.body || {};
    if (!projectIdea) {
      return res.status(400).json({ error: 'projectIdea is required' });
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });
    }

    const anthropic = new Anthropic({ apiKey });
    const content = buildUserMessage(projectIdea, dimensions, materialsAccess, experienceLevel, media || []);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const text = message.content.find((b) => b.type === 'text')?.text || '{}';
    let guide;
    try {
      guide = JSON.parse(text.trim());
    } catch {
      guide = { title: null, summary: { materials: [], tools: [] }, steps: [{ number: 1, title: 'Instructions', body: text }] };
    }
    if (!guide.title && guide.summary) guide.title = null;
    return res.status(200).json(guide);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to generate guide' });
  }
}
