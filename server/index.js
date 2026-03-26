import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { GENERATE_SYSTEM_PROMPT, CHAT_EXPERT_SYSTEM_PROMPT, buildGuideContextForChat } from '../lib/aiPrompts.js';

// API key must come from .env only — never hardcode ANTHROPIC_API_KEY.
const apiKey = process.env.ANTHROPIC_API_KEY;

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

const anthropic = new Anthropic({ apiKey });

function normalizeVagueText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/([^\w\s])/g, ' ')
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasVagueSizeLanguage(value) {
  const normalized = normalizeVagueText(value);
  const tokens = normalized.split(' ').filter(Boolean);
  return tokens.some((token) => (
    ['kinda', 'kind', 'sorta', 'sort', 'pretty', 'somewhat', 'about', 'around', 'ish', 'tall', 'short', 'big', 'small', 'large', 'medium', 'normal']
      .some((keyword) => token.startsWith(keyword))
  ));
}

function maybeNeedsClarification(projectIdea, dimensions) {
  const idea = String(projectIdea || '').toLowerCase();
  const dims = String(dimensions || '').toLowerCase().trim();
  const hasNumericMeasurement = /\b\d+(\.\d+)?\s*(in|inch|inches|ft|foot|feet|cm|mm|m|")\b/i.test(dims);
  const likelyNeedsExplicitSizing = /\b(table|desk|bench|shelf|cabinet|bookcase|island|counter|vanity|workbench|console)\b/i.test(idea);

  if (!likelyNeedsExplicitSizing) return null;

  if (!dims) {
    return {
      needsClarification: true,
      message: 'This project usually needs exact sizing to avoid bad cuts or awkward proportions.',
      questions: [
        'What finished height do you want?',
        'What finished width and length do you want?',
        'Any max size limits from your room or doorway?',
      ],
    };
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
    };
  }

  return null;
}

function buildUserMessage(projectIdea, designDescription, dimensions, materialsAccess, experienceLevel, media) {
  const parts = [
    `Project idea: ${projectIdea}`,
    designDescription ? `Design description: ${designDescription}` : null,
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
    const { projectIdea, designDescription, dimensions, materialsAccess, experienceLevel, media } = req.body;
    if (!projectIdea) {
      return res.status(400).json({ error: 'projectIdea is required' });
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
    }

    const clarification = maybeNeedsClarification(projectIdea, dimensions);
    if (clarification) {
      return res.status(200).json(clarification);
    }

    const content = buildUserMessage(
      projectIdea,
      designDescription,
      dimensions,
      materialsAccess,
      experienceLevel,
      media || [],
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: GENERATE_SYSTEM_PROMPT,
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

app.post('/api/chat', async (req, res) => {
  try {
    const { projectIdea, guide, messages } = req.body || {};
    if (typeof projectIdea !== 'string' || !guide || typeof guide !== 'object' || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'projectIdea (string), guide (object), and messages (array) are required' });
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
    }

    const guideBlock = buildGuideContextForChat(projectIdea, guide);
    const system = `${CHAT_EXPERT_SYSTEM_PROMPT}\n\n--- GUIDE CONTEXT (authoritative for this project) ---\n${guideBlock}`;
    const chatMessages = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: String(m.content) }));

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
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
