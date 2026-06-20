import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
// Doubt-solving is a per-request AI call — never cache.
export const dynamic = 'force-dynamic'

interface AskBody {
  question?: unknown
  subject?: unknown
}

const ALLOWED_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Maths',
  'Biology',
  'Computer Science',
  'English',
] as const

const MAX_QUESTION_LEN = 2000

/**
 * POST /api/doubts/ask
 *
 * Body: { question: string, subject: string }
 * Returns: { answer: string } — a worked, step-by-step solution from an
 * expert AI tutor for the given subject.
 *
 * The z-ai-web-dev-sdk is used server-side only (per SDK contract). The
 * system prompt pins the model to an encouraging exam-prep tutor persona so
 * answers are pedagogically useful, not just fact dumps.
 */
export async function POST(req: NextRequest) {
  let body: AskBody
  try {
    body = (await req.json()) as AskBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const question = typeof body.question === 'string' ? body.question.trim() : ''
  const subject =
    typeof body.subject === 'string' && (ALLOWED_SUBJECTS as readonly string[]).includes(body.subject)
      ? body.subject
      : 'General'

  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }
  if (question.length > MAX_QUESTION_LEN) {
    return NextResponse.json(
      { error: `Question is too long (max ${MAX_QUESTION_LEN} chars)` },
      { status: 400 }
    )
  }

  try {
    const zai = await ZAI.create()

    const systemPrompt = [
      `You are Delta AI Tutor — an expert ${subject} teacher for competitive-exam aspirants (JEE / NEET / boards).`,
      "Solve the student's doubt with a clear, step-by-step explanation.",
      'Guidelines:',
      '- Start with a one-line direct answer or key insight.',
      '- Then walk through the reasoning in numbered steps.',
      '- Use plain text (no Markdown tables, no code fences). You may use *italics* sparingly for emphasis.',
      '- Include a concrete example or numerical illustration when it clarifies the concept.',
      '- End with a short "Takeaway" line.',
      '- Keep it under ~220 words. Be encouraging and precise — never hand-wave.',
      '- If the doubt is ambiguous, state your assumption before solving.',
    ].join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: question },
      ],
      thinking: { type: 'disabled' },
    })

    const answer = completion.choices[0]?.message?.content?.trim()
    if (!answer) {
      return NextResponse.json(
        { error: 'The tutor returned an empty response. Please rephrase and try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ answer })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/doubts/ask] failed:', message)
    return NextResponse.json(
      { error: 'The tutor is unavailable right now. Please try again in a moment.' },
      { status: 502 }
    )
  }
}
