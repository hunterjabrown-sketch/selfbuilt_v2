import { ANTHROPIC_MODEL_COST_ESTIMATE } from './anthropicModels.js'

export async function fetchCostEstimateForGuide(anthropic, projectIdea, guide) {
  try {
    const materials = guide?.summary?.materials
    const list = Array.isArray(materials)
      ? materials.map((m) => String(m).trim()).filter(Boolean).join(', ')
      : ''

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL_COST_ESTIMATE,
      max_tokens: 1024,
      system: 'You are a construction cost estimator. Return only a valid JSON object with no markdown, no explanation, nothing else.',
      messages: [
        {
          role: 'user',
          content: `Generate a contractor cost estimate for this DIY project. Project: ${String(projectIdea || '').trim()}. Materials list: ${list || '(none listed)'}. Return exactly this JSON shape with all integer values: { "estimatedLaborHoursLow": integer, "estimatedLaborHoursHigh": integer, "contractorHourlyRateLow": integer, "contractorHourlyRateHigh": integer, "contractorLaborCostLow": integer, "contractorLaborCostHigh": integer, "contractorMaterialsCostLow": integer, "contractorMaterialsCostHigh": integer, "contractorMaterialsMarkupNote": "string", "contractorTotalLow": integer, "contractorTotalHigh": integer, "yourMaterialsCostLow": integer, "yourMaterialsCostHigh": integer, "estimatedSavingsLow": integer, "estimatedSavingsHigh": integer, "laborBasisNote": "string", "materialsBasisNote": "string" }. Labor anchors: floating shelf 2 to 4 hours, deck 40 to 120 hours, dining table 8 to 20 hours, couch 12 to 30 hours, garden bed 2 to 5 hours. Contractor rates: general carpenter 50 to 85 per hour, finish carpenter 70 to 100 per hour. contractorLaborCostLow = estimatedLaborHoursLow times contractorHourlyRateLow. contractorMaterialsCostLow = yourMaterialsCostLow times 1.2 rounded. contractorTotalLow = contractorLaborCostLow plus contractorMaterialsCostLow. estimatedSavingsLow = contractorTotalLow minus yourMaterialsCostHigh.`,
        },
      ],
    })

    const text = message.content.find((b) => b.type === 'text')?.text || ''
    console.log('[costEstimate] raw:', text.slice(0, 200))

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    console.log('[costEstimate] parsed ok:', Object.keys(parsed).join(', '))
    return parsed
  } catch (err) {
    console.error('[costEstimate] error:', err?.message || err)
    return null
  }
}
