/**
 * Vercel serverless: GET /api/videos/step
 *
 * Required environment variable: YOUTUBE_API_KEY
 * YouTube Data API v3 must be enabled for the key's Google Cloud project.
 */

import { fetchTopVideoForStep } from '../../lib/youtubeVideoSearch.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(200).json({ video: null })
  }

  try {
    const stepTitle = String(req.query?.stepTitle || '').trim()
    const projectType = String(req.query?.projectType || '').trim()
    const experienceLevel = String(req.query?.experienceLevel || '').trim()
    const excludeVideoIds = String(req.query?.excludeVideoIds || '').trim()

    if (!stepTitle || !projectType) {
      return res.status(200).json({ video: null })
    }

    const video = await fetchTopVideoForStep({
      stepTitle,
      projectType,
      experienceLevel,
      excludeVideoIds: excludeVideoIds || undefined,
    })
    if (video) {
      return res.status(200).json({
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl,
      })
    }
    return res.status(200).json({ video: null })
  } catch (err) {
    console.error('[api/videos/step]', err)
    return res.status(200).json({ video: null })
  }
}
