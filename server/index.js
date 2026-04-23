/**
 * Required environment variables:
 * - ANTHROPIC_API_KEY — guide generation and chat
 * - YOUTUBE_API_KEY — GET /api/videos/step (YouTube Data API v3; enable the API in Google Cloud)
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import {
  CHAT_EXPERT_SYSTEM_PROMPT,
  buildGuideContextForChat,
  GENERATE_SYSTEM_PROMPT,
  GENERATE_SYSTEM_PROMPT_RETRY,
} from '../lib/aiPrompts.js';
import { applyShowVideoToGuide } from '../lib/stepVideoEligibility.js';
import { fetchTopVideoForStep } from '../lib/youtubeVideoSearch.js';
import { ANTHROPIC_MODEL_GUIDE_GENERATION, ANTHROPIC_MODEL_PROJECT_CHAT } from '../lib/anthropicModels.js';
import { omitLegacyPartialGuideFields, parseCompleteGuideFromModelText } from '../lib/guideApiContract.js';
import { fetchCostEstimateForGuide } from '../lib/costEstimateHaiku.js';
import { classifyIteration } from '../lib/iterationClassifierHaiku.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

// Never hardcode API keys.
const apiKey = process.env.ANTHROPIC_API_KEY;

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

const anthropic = new Anthropic({ apiKey });

function buildUserMessage(
  projectIdea,
  designDescription,
  dimensions,
  materialsAccess,
  experienceLevel,
  media,
) {
  const parts = [
    `Project idea: ${projectIdea}`,
    designDescription ? `Design description: ${designDescription}` : null,
    dimensions ? `Dimensions/space: ${dimensions}` : null,
    materialsAccess ? `Materials they have access to: ${materialsAccess}` : null,
    experienceLevel ? `Experience level: ${experienceLevel}` : null,
  ].filter(Boolean);

  const userText = parts.join('\n');
  const content = [{ type: 'text', text: userText }];

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

async function fetchAssistantText(system, content) {
  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL_GUIDE_GENERATION,
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content }],
  });
  return message.content.find((b) => b.type === 'text')?.text || '';
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

    const content = buildUserMessage(
      projectIdea,
      designDescription,
      dimensions,
      materialsAccess,
      experienceLevel,
      media || [],
    );

    let text = await fetchAssistantText(GENERATE_SYSTEM_PROMPT, content);
    console.log('[api/generate] first Anthropic raw text (full):', text);

    let guide = parseCompleteGuideFromModelText(text);
    console.log(
      '[api/generate] first parseCompleteGuideFromModelText:',
      guide === null ? 'null' : 'guide',
    );

    if (!guide) {
      text = await fetchAssistantText(GENERATE_SYSTEM_PROMPT_RETRY, content);
      console.log('[api/generate] retry Anthropic raw text (full):', text);

      guide = parseCompleteGuideFromModelText(text);
      console.log(
        '[api/generate] retry parseCompleteGuideFromModelText:',
        guide === null ? 'null' : 'guide',
      );
    }

    if (!guide) {
      return res.status(500).json({ error: 'Could not generate a complete guide. Try again.' });
    }

    guide = omitLegacyPartialGuideFields(guide);
    guide = applyShowVideoToGuide(guide, experienceLevel);

    const costEstimate = await fetchCostEstimateForGuide(anthropic, projectIdea, guide);
    guide = { ...guide, costEstimate: costEstimate ?? null };

    res.json(guide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to generate guide' });
  }
});

app.get('/api/videos/step', async (req, res) => {
  try {
    const stepTitle = String(req.query.stepTitle || '').trim();
    const projectType = String(req.query.projectType || '').trim();
    const experienceLevel = String(req.query.experienceLevel || '').trim();
    const excludeVideoIds = String(req.query.excludeVideoIds || '').trim();
    if (!stepTitle || !projectType) {
      return res.status(200).json({ video: null });
    }
    const video = await fetchTopVideoForStep({
      stepTitle,
      projectType,
      experienceLevel,
      excludeVideoIds: excludeVideoIds || undefined,
    });
    if (video) {
      return res.status(200).json({
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl,
      });
    }
    return res.status(200).json({ video: null });
  } catch (err) {
    console.error('[api/videos/step]', err);
    return res.status(200).json({ video: null });
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
      model: ANTHROPIC_MODEL_PROJECT_CHAT,
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

const CAD_SERVICE_URL = process.env.CAD_SERVICE_URL || 'http://127.0.0.1:3002';

async function proxyCad(pathname, req, res) {
  try {
    const body = req.method === 'GET' ? undefined : JSON.stringify(req.body || {});
    const response = await fetch(`${CAD_SERVICE_URL}${pathname}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const text = await response.text();
    res.status(response.status);
    try { res.json(JSON.parse(text)); } catch { res.type('text/plain').send(text); }
  } catch (err) {
    console.error('[cad proxy]', err);
    res.status(502).json({
      ok: false,
      error: `CAD service unreachable at ${CAD_SERVICE_URL}. Is it running? (${err.message})`,
    });
  }
}

app.post('/api/cad/generate', (req, res) => proxyCad('/cad/generate', req, res));
app.post('/api/cad/execute',  (req, res) => proxyCad('/cad/execute',  req, res));
app.get( '/api/cad/health',   (req, res) => proxyCad('/cad/health',   req, res));

// DSL generation — routes browser Claude calls through the server so the API
// key lives only in .env and is never exposed to the client.
app.post('/api/dsl', async (req, res) => {
  try {
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
    const { messages, systemPrompt } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: systemPrompt || '',
      messages,
    });
    const text = message.content.find((b) => b.type === 'text')?.text || '';
    res.json({ text });
  } catch (err) {
    console.error('[api/dsl]', err);
    res.status(500).json({ error: err.message || 'DSL generation failed' });
  }
});

app.post('/api/classifyIteration', async (req, res) => {
  try {
    const { projectIdea, baseDesign, iterationMessage } = req.body || {};
    if (!iterationMessage || typeof iterationMessage !== 'string') {
      return res.status(400).json({ error: 'iterationMessage (string) is required' });
    }
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in .env' });
    }
    const result = await classifyIteration(anthropic, {
      projectIdea: projectIdea || '',
      baseDesign: baseDesign || null,
      iterationMessage,
    });
    if (!result) {
      return res.status(200).json({
        kind: 'structural',
        requiresGuideRegen: true,
        summary: 'Classifier unavailable; assuming guide may be stale.',
        fallback: true,
      });
    }
    return res.json(result);
  } catch (err) {
    console.error('[api/classify-iteration]', err);
    return res.status(500).json({ error: err.message || 'classify-iteration failed' });
  }
});

// Must run at module top level (not inside a function or conditional) so the process stays alive.
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
