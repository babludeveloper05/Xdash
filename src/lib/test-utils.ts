/**
 * Test question generator — generates random questions for practice tests.
 * Previously in mock-data.ts; extracted so the app doesn't depend on mock data.
 */
import type { Question } from './types'

const SUBJECT_TOPICS: Record<string, string[]> = {
  Physics: ['kinematics', 'thermodynamics', 'electromagnetism', 'optics', 'modern physics'],
  Chemistry: ['mole concept', 'chemical bonding', 'equilibrium', 'organic reactions', 'electrochemistry'],
  Maths: ['calculus', 'algebra', 'geometry', 'probability', 'trigonometry'],
  Biology: ['cell biology', 'genetics', 'physiology', 'ecology', 'evolution'],
  'Computer Science': ['data structures', 'algorithms', 'OOP', 'databases', 'networking'],
  English: ['grammar', 'vocabulary', 'comprehension', 'sentence correction', 'analogies'],
}

const OPTION_TEMPLATES = [
  'The statement is correct under standard conditions',
  'The relationship holds only at constant temperature',
  'This violates the conservation principle',
  'The value approaches zero as the limit increases',
]

export function buildQuestions(count: number, subject = 'Physics'): Question[] {
  const topics = SUBJECT_TOPICS[subject] ?? ['general concepts']
  const questions: Question[] = []
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length]
    const correctIdx = Math.floor(Math.random() * 4)
    questions.push({
      id: `q-${i + 1}`,
      text: `Which of the following is correct regarding ${topic}? (Q${i + 1})`,
      options: [...OPTION_TEMPLATES].sort(() => Math.random() - 0.5),
      correctIndex: correctIdx,
      explanation: `The correct answer is option ${String.fromCharCode(65 + correctIdx)}. This is because the fundamental principle of ${topic} dictates that the relationship holds under the given conditions.`,
      subject,
    })
  }
  return questions
}
