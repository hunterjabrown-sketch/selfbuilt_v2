/**
 * YouTube Data API v3: single top search result for step instructional video.
 * Required env: YOUTUBE_API_KEY (set in server / Vercel; not used at build time).
 * Search queries are synthesized via Anthropic (Haiku) before each YouTube request.
 */

import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_MODEL_YOUTUBE_QUERY } from './anthropicModels.js'

const YOUTUBE_QUERY_SYSTEM =
  'You generate YouTube search queries. Return only the search query string, no punctuation, no explanation, nothing else.'

function parseExcludeVideoIds(excludeVideoIds) {
  if (!excludeVideoIds) return new Set()
  if (Array.isArray(excludeVideoIds)) {
    return new Set(excludeVideoIds.map((id) => String(id).trim()).filter(Boolean))
  }
  return new Set(
    String(excludeVideoIds)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  )
}

function fallbackYoutubeSearchQuery(stepTitle) {
  const words = String(stepTitle || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
  return [...words, 'DIY', 'how', 'to'].join(' ').trim()
}

/**
 * @param {string} stepTitle
 * @param {string} projectType
 */
async function synthesizeYoutubeSearchQuery(stepTitle, projectType) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return fallbackYoutubeSearchQuery(stepTitle)
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL_YOUTUBE_QUERY,
      max_tokens: 50,
      system: YOUTUBE_QUERY_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Write the perfect YouTube search query to find a beginner DIY instructional video for this step: ${stepTitle}. Project type: ${projectType}. The query should find a real how-to video teaching this specific technique.`,
        },
      ],
    })
    const raw = message.content.find((b) => b.type === 'text')?.text || ''
    const q = raw
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!q) {
      return fallbackYoutubeSearchQuery(stepTitle)
    }
    return q
  } catch {
    return fallbackYoutubeSearchQuery(stepTitle)
  }
}

/**
 * @param {{ stepTitle: string, projectType: string, experienceLevel?: string, excludeVideoIds?: string[] | string }} args
 * experienceLevel is accepted for API parity; search query uses stepTitle + projectType only.
 * excludeVideoIds: YouTube video id(s) already used in this guide; first search hit not in this set is returned.
 * @returns {Promise<{ title: string, thumbnailUrl: string, videoUrl: string } | null>}
 */
export async function fetchTopVideoForStep({
  stepTitle,
  projectType,
  experienceLevel: _experienceLevel,
  excludeVideoIds,
}) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return null

  const st = String(stepTitle || '').trim()
  const pt = String(projectType || '').trim()
  if (!st || !pt) return null

  const exclude = parseExcludeVideoIds(excludeVideoIds)
  const q = await synthesizeYoutubeSearchQuery(st, pt)

  // Need enough candidates to skip duplicates; cap at YouTube search.list max (50).
  const maxResults = Math.min(50, Math.max(10, 8 + exclude.size * 4))

  function buildSearchUrl() {
    const u = new URL('https://www.googleapis.com/youtube/v3/search')
    u.searchParams.set('part', 'snippet')
    u.searchParams.set('q', q)
    u.searchParams.set('type', 'video')
    u.searchParams.set('videoDuration', 'medium')
    u.searchParams.set('videoEmbeddable', 'true')
    u.searchParams.set('relevanceLanguage', 'en')
    u.searchParams.set('maxResults', String(maxResults))
    u.searchParams.set('key', key)
    return u
  }

  function pickFirstUnusedVideo(items) {
    for (const item of items) {
      const rawId = item?.id?.videoId
      const videoId = rawId ? String(rawId).trim() : ''
      if (!videoId || exclude.has(videoId)) continue

      const sn = item.snippet || {}
      const medium = sn.thumbnails?.medium
      const thumbnailUrl = medium?.url || ''

      return {
        title: sn.title || 'Video',
        thumbnailUrl,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      }
    }

    return null
  }

  try {
    const url = buildSearchUrl()
    console.log('[youtube] search URL:', url.toString().replace(/key=[^&]+/i, 'key=***'))

    const r = await fetch(url)
    if (!r.ok) {
      return null
    }
    const data = await r.json()
    const items = data.items || []
    return pickFirstUnusedVideo(items)
  } catch {
    return null
  }
}
