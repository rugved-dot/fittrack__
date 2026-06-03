import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `You are a nutrition expert. Analyze this food image and estimate the nutritional content.

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "name": "food name (be specific, e.g. 'Grilled Chicken Breast' not just 'Chicken')",
  "calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "serving": "estimated serving size (e.g. '1 medium plate ~350g')",
  "confidence": "high" | "medium" | "low"
}

Base estimates on a typical single serving visible in the image. If you cannot identify food in the image, return: {"error": "No food detected"}`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Could not parse food data from image' }, { status: 422 })
    }

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 422 })
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('analyze-food error:', err)
    const msg: string = err?.message ?? ''
    const status: number = err?.status ?? 500

    if (status === 401 || msg.includes('authentication_error') || msg.includes('invalid x-api-key')) {
      return NextResponse.json({ error: 'API key invalid' }, { status: 401 })
    }
    if (status === 402 || msg.includes('credit') || msg.includes('balance')) {
      return NextResponse.json({ error: 'Insufficient API credits' }, { status: 402 })
    }
    if (status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
