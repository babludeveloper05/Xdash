// Deterministic seeded mock data for Project Delta.
// Using a seeded PRNG so SSR/CSR and reloads stay consistent.

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260616)
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const round2 = (n: number) => Math.round(n * 100) / 100

export type SubjectId =
  | 'physics'
  | 'chemistry'
  | 'maths'
  | 'biology'
  | 'cs'
  | 'english'

export interface Subject {
  id: SubjectId
  name: string
  icon: string
  color: string
}

export interface Chapter {
  id: string
  subjectId: SubjectId
  number: number
  title: string
  topicCount: number
  durationMin: number
}

export interface Video {
  id: string
  chapterId: string
  subjectId: SubjectId
  number: number
  title: string
  instructor: string
  durationSec: number
}

export interface TestItem {
  id: string
  name: string
  type: 'JEE Main' | 'JEE Advanced' | 'Chapter Test' | 'Full Syllabus' | 'Previous Year'
  subject: string
  questionCount: number
  durationMin: number
  deadlineHours: number | null // null = no deadline
  difficulty: 'Easy' | 'Moderate' | 'Hard'
}

export interface Question {
  id: string
  text: string
  options: string[]
  correctIndex: number
  explanation: string
  subject: string
}

export interface NoteItem {
  id: string
  title: string
  subject: string
  content: string
  tags: string[]
  updatedAt: number
}

export interface LeaderEntry {
  id: string
  name: string
  score: number
  streak: number
  change: number
  batch: string
  rank: number
  you?: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  category: 'Study Streak' | 'Test Mastery' | 'Subject Expert' | 'Special'
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  icon: string
  earned: boolean
  earnedAt: string | null
  progress: number // 0..1 toward unlock when locked
}

export interface LiveSession {
  id: string
  subject: string
  topic: string
  instructor: string
  startsInHours: number
  viewers: number
  isLive: boolean
}

export const SUBJECTS: Subject[] = [
  { id: 'physics', name: 'Physics', icon: 'Atom', color: 'oklch(0.74 0.135 62)' },
  { id: 'chemistry', name: 'Chemistry', icon: 'FlaskConical', color: 'oklch(0.7 0.13 150)' },
  { id: 'maths', name: 'Maths', icon: 'Sigma', color: 'oklch(0.72 0.1 250)' },
  { id: 'biology', name: 'Biology', icon: 'Dna', color: 'oklch(0.7 0.13 30)' },
  { id: 'cs', name: 'Computer Science', icon: 'Cpu', color: 'oklch(0.75 0.09 200)' },
  { id: 'english', name: 'English', icon: 'BookOpen', color: 'oklch(0.78 0.05 90)' },
]

const INSTRUCTORS = ['NV Sir', 'AS Mam', 'GB Sir', 'MC Sir', 'RK Mam', 'JP Sir']

const CHAPTER_TITLES: Record<SubjectId, string[]> = {
  physics: [
    'Units & Measurements', 'Kinematics', 'Laws of Motion', 'Work, Energy & Power',
    'Rotational Dynamics', 'Gravitation', 'Thermodynamics', 'Oscillations & Waves',
    'Electrostatics', 'Current Electricity', 'Magnetism', 'Modern Physics',
  ],
  chemistry: [
    'Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'Thermochemistry',
    'Equilibrium', 'Redox Reactions', 'Periodic Table', 'Coordination Compounds',
    'Hydrocarbons', 'Haloalkanes', 'Aldehydes & Ketones', 'Biomolecules',
  ],
  maths: [
    'Sets & Relations', 'Complex Numbers', 'Quadratic Equations', 'Sequences & Series',
    'Permutations', 'Binomial Theorem', 'Matrices & Determinants', 'Limits & Continuity',
    'Differentiation', 'Integration', 'Differential Equations', 'Vectors & 3D Geometry',
  ],
  biology: [
    'Cell Biology', 'Biomolecules', 'Plant Physiology', 'Human Physiology',
    'Reproduction', 'Genetics', 'Evolution', 'Biotechnology',
    'Ecology', 'Microbiology', 'Anatomy', 'Molecular Biology',
  ],
  cs: [
    'Programming Basics', 'Data Types', 'Control Flow', 'Functions',
    'Arrays & Strings', 'OOP Concepts', 'Recursion', 'Data Structures',
    'Algorithms', 'Databases', 'Networking', 'Operating Systems',
  ],
  english: [
    'Reading Comprehension', 'Grammar Essentials', 'Vocabulary', 'Sentence Correction',
    'Para Jumbles', 'Critical Reasoning', 'Verbal Analogies', 'Idioms & Phrases',
    'Precis Writing', 'Essay Structure', 'Error Spotting', 'Cloze Test',
  ],
}

const TOPIC_FRAGMENTS = [
  'Introduction & Fundamentals', 'Core Concepts', 'Solved Examples', 'JEE Level Problems',
  'Advanced Applications', 'Previous Year Questions', 'Quick Revision', 'Tricks & Shortcuts',
]

export const chapters: Chapter[] = []
export const videos: Video[] = []

SUBJECTS.forEach((subject) => {
  CHAPTER_TITLES[subject.id].forEach((title, ci) => {
    const chapterId = `${subject.id}-c${ci + 1}`
    chapters.push({
      id: chapterId,
      subjectId: subject.id,
      number: ci + 1,
      title,
      topicCount: 5,
      durationMin: between(95, 220),
    })
    for (let vi = 0; vi < 5; vi++) {
      videos.push({
        id: `${chapterId}-v${vi + 1}`,
        chapterId,
        subjectId: subject.id,
        number: vi + 1,
        title: `${title}: ${TOPIC_FRAGMENTS[vi % TOPIC_FRAGMENTS.length]}`,
        instructor: pick(INSTRUCTORS),
        durationSec: between(18, 62) * 60,
      })
    }
  })
})

// Tests
const TEST_TYPES: TestItem['type'][] = [
  'JEE Main', 'JEE Advanced', 'Chapter Test', 'Full Syllabus', 'Previous Year',
]
const SUBJECT_NAMES = ['Physics', 'Chemistry', 'Maths', 'Full Syllabus']
export const tests: TestItem[] = Array.from({ length: 54 }, (_, i) => {
  const type = TEST_TYPES[i % TEST_TYPES.length]
  const subject = type === 'Full Syllabus' ? 'Full Syllabus' : pick(SUBJECT_NAMES)
  const deadlineRoll = rand()
  const deadlineHours =
    deadlineRoll < 0.18 ? between(2, 23) : deadlineRoll < 0.4 ? between(24, 70) : null
  return {
    id: `test-${i + 1}`,
    name:
      type === 'Previous Year'
        ? `JEE ${between(2014, 2025)} ${subject} Paper`
        : `${type} Mock ${String(i + 1).padStart(2, '0')} — ${subject}`,
    type,
    subject,
    questionCount: type === 'JEE Advanced' ? 54 : 90,
    durationMin: type === 'JEE Advanced' ? 180 : 120,
    deadlineHours,
    difficulty: pick<TestItem['difficulty']>(['Easy', 'Moderate', 'Hard']),
  }
})

// A reusable question bank for the attempt flow
const QUESTION_BANK: Record<string, { text: string; options: string[]; correct: number; exp: string }[]> = {
  Physics: [
    {
      text: 'A particle moves in a circle of radius R with constant speed v. The magnitude of its acceleration is:',
      options: ['v/R', 'v²/R', 'vR', 'v²R'],
      correct: 1,
      exp: 'Centripetal acceleration a = v²/R, always directed toward the center.',
    },
    {
      text: 'The dimensional formula of Planck constant is the same as that of:',
      options: ['Energy', 'Power', 'Angular momentum', 'Force'],
      correct: 2,
      exp: 'Planck constant h has dimensions [M L² T⁻¹], identical to angular momentum.',
    },
  ],
  Chemistry: [
    {
      text: 'Which of the following has the maximum number of unpaired electrons?',
      options: ['Mn²⁺', 'Fe²⁺', 'Cr²⁺', 'Ni²⁺'],
      correct: 0,
      exp: 'Mn²⁺ (3d⁵) has 5 unpaired electrons, the maximum among the options.',
    },
    {
      text: 'The hybridization of carbon in diamond is:',
      options: ['sp', 'sp²', 'sp³', 'sp³d'],
      correct: 2,
      exp: 'Each carbon in diamond is tetrahedrally bonded → sp³ hybridization.',
    },
  ],
  Maths: [
    {
      text: 'The value of lim(x→0) sin(x)/x is:',
      options: ['0', '1', '∞', 'undefined'],
      correct: 1,
      exp: 'This is a standard limit equal to 1.',
    },
    {
      text: 'If A is a 3×3 matrix with det(A) = 5, then det(2A) equals:',
      options: ['10', '20', '40', '80'],
      correct: 2,
      exp: 'det(kA) = kⁿ det(A) = 2³ × 5 = 40 for a 3×3 matrix.',
    },
  ],
}
const GENERIC_SUBJECTS = ['Physics', 'Chemistry', 'Maths']
export function buildQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => {
    const subject = GENERIC_SUBJECTS[i % 3]
    const bank = QUESTION_BANK[subject]
    const q = bank[i % bank.length]
    return {
      id: `q-${i + 1}`,
      text: `Q${i + 1}. ${q.text}`,
      options: q.options,
      correctIndex: q.correct,
      explanation: q.exp,
      subject,
    }
  })
}

// Notes
const NOTE_TITLES = [
  'Rotational Motion key formulas', 'Organic reaction map', 'Integration by parts cheatsheet',
  'Electrostatics doubt notes', 'Periodic trends summary', 'Vectors quick recap',
  'Thermodynamics laws', 'Complex number identities', 'Kinematics graphs',
  'Coordination compounds', 'Limits shortcut tricks', 'Modern physics constants',
]
const NOTE_BODIES = [
  'Remember: torque τ = Iα. Moment of inertia depends on mass distribution. For a solid sphere I = 2/5 MR².',
  'Markovnikov vs anti-Markovnikov addition. Peroxide effect reverses orientation for HBr only.',
  '∫u dv = uv − ∫v du. Choose u by ILATE priority: Inverse, Log, Algebraic, Trig, Exponential.',
  'Field due to point charge E = kq/r². Superposition applies. Equipotential surfaces ⟂ field lines.',
  'Atomic radius decreases across a period, increases down a group. IE shows reverse trend.',
]
export const notes: NoteItem[] = Array.from({ length: 28 }, (_, i) => ({
  id: `note-${i + 1}`,
  title: NOTE_TITLES[i % NOTE_TITLES.length] + (i >= NOTE_TITLES.length ? ` (${Math.floor(i / NOTE_TITLES.length) + 1})` : ''),
  subject: pick(['Physics', 'Chemistry', 'Maths', 'Biology']),
  content: pick(NOTE_BODIES),
  tags: [pick(['formula', 'revision', 'doubt', 'important', 'exam']), pick(['quick', 'detailed', 'pyq'])],
  updatedAt: Date.now() - between(0, 60) * 86400000,
}))

// Leaderboard
const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Myra', 'Ira', 'Tara', 'Kabir', 'Rohan', 'Neha']
const LAST = ['Sharma', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Nair', 'Patel', 'Singh', 'Das', 'Mehta', 'Rao', 'Joshi', 'Bose', 'Kapoor', 'Menon']
const BATCHES = ['Nucleus 2026', 'Quantum 2026', 'Apex 2027', 'Vortex 2026']
export const leaderboard: LeaderEntry[] = Array.from({ length: 1000 }, (_, i) => {
  const base = 2980 - i * 2.6 - rand() * 18
  return {
    id: `lb-${i + 1}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    score: Math.max(420, Math.round(base)),
    streak: between(0, 180),
    change: between(-6, 8),
    batch: pick(BATCHES),
    rank: i + 1,
  }
})
  // Sort by score descending and reassign ranks so the standings are strictly
  // monotonic (higher rank ⇒ higher score). The seeded score noise would
  // otherwise leave rank #3 occasionally outscoring rank #2, etc.
  .sort((a, b) => b.score - a.score)
  .map((entry, i) => ({ ...entry, rank: i + 1 }))
// Inject "you" at rank 47 (keep that slot's score so the standings stay ordered)
leaderboard[46] = { ...leaderboard[46], name: 'Aryan Sharma', you: true, batch: 'Nucleus 2026' }

// Activity feed
const ACTIVITY_TEMPLATES = [
  { type: 'video', label: 'Completed “Rotational Dynamics: JEE Level Problems”' },
  { type: 'test', label: 'Scored 168/300 on JEE Main Mock 12' },
  { type: 'note', label: 'Created note “Integration by parts cheatsheet”' },
  { type: 'live', label: 'Attended Live: Electrostatics with NV Sir' },
  { type: 'streak', label: 'Extended study streak to 23 days' },
  { type: 'badge', label: 'Unlocked “Century Club” achievement' },
]
export const activity = Array.from({ length: 18 }, (_, i) => {
  const t = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length]
  return { id: `act-${i + 1}`, type: t.type, label: t.label, minutesAgo: (i + 1) * between(20, 95) }
})

// Achievements
const ACH: Omit<Achievement, 'id'>[] = [
  { title: 'First Steps', description: 'Complete your first video lecture', category: 'Study Streak', rarity: 'Common', icon: 'Footprints', earned: true, earnedAt: '12 Jan 2026', progress: 1 },
  { title: 'Week Warrior', description: 'Maintain a 7-day study streak', category: 'Study Streak', rarity: 'Common', icon: 'Flame', earned: true, earnedAt: '19 Jan 2026', progress: 1 },
  { title: 'Unstoppable', description: 'Maintain a 30-day study streak', category: 'Study Streak', rarity: 'Rare', icon: 'Zap', earned: true, earnedAt: '14 Feb 2026', progress: 1 },
  { title: 'Iron Will', description: 'Maintain a 100-day study streak', category: 'Study Streak', rarity: 'Epic', icon: 'Shield', earned: false, earnedAt: null, progress: 0.62 },
  { title: 'Century Club', description: 'Score above 100 in 10 tests', category: 'Test Mastery', rarity: 'Rare', icon: 'Target', earned: true, earnedAt: '02 Mar 2026', progress: 1 },
  { title: 'Perfectionist', description: 'Score 100% on any test', category: 'Test Mastery', rarity: 'Epic', icon: 'Crown', earned: false, earnedAt: null, progress: 0.94 },
  { title: 'Test Titan', description: 'Attempt 50 tests', category: 'Test Mastery', rarity: 'Rare', icon: 'Swords', earned: true, earnedAt: '08 Mar 2026', progress: 1 },
  { title: 'Physics Sage', description: 'Complete all Physics chapters', category: 'Subject Expert', rarity: 'Epic', icon: 'Atom', earned: false, earnedAt: null, progress: 0.71 },
  { title: 'Chem Master', description: 'Complete all Chemistry chapters', category: 'Subject Expert', rarity: 'Epic', icon: 'FlaskConical', earned: false, earnedAt: null, progress: 0.55 },
  { title: 'Maths Maestro', description: 'Complete all Maths chapters', category: 'Subject Expert', rarity: 'Epic', icon: 'Sigma', earned: false, earnedAt: null, progress: 0.48 },
  { title: 'Triple Crown', description: 'Reach 80% in all three core subjects', category: 'Subject Expert', rarity: 'Legendary', icon: 'Trophy', earned: false, earnedAt: null, progress: 0.4 },
  { title: 'Night Owl', description: 'Study after midnight 10 times', category: 'Special', rarity: 'Common', icon: 'Moon', earned: true, earnedAt: '21 Jan 2026', progress: 1 },
  { title: 'Early Bird', description: 'Study before 6 AM 10 times', category: 'Special', rarity: 'Rare', icon: 'Sunrise', earned: false, earnedAt: null, progress: 0.3 },
  { title: 'Top 50', description: 'Reach top 50 on the leaderboard', category: 'Special', rarity: 'Epic', icon: 'Medal', earned: true, earnedAt: '11 Mar 2026', progress: 1 },
  { title: 'Legend', description: 'Reach rank #1 on the leaderboard', category: 'Special', rarity: 'Legendary', icon: 'Sparkles', earned: false, earnedAt: null, progress: 0.12 },
  { title: 'Doubt Destroyer', description: 'Resolve 100 doubts', category: 'Special', rarity: 'Rare', icon: 'MessageCircleQuestion', earned: false, earnedAt: null, progress: 0.66 },
]
export const achievements: Achievement[] = ACH.map((a, i) => ({ ...a, id: `ach-${i + 1}` }))

// Live sessions
export const liveSessions: LiveSession[] = [
  { id: 'live-1', subject: 'Physics', topic: 'Rotational Dynamics — Torque & Angular Momentum', instructor: 'NV Sir', startsInHours: 0, viewers: 1240, isLive: true },
  { id: 'live-2', subject: 'Chemistry', topic: 'Chemical Equilibrium — Le Chatelier', instructor: 'AS Mam', startsInHours: 2, viewers: 0, isLive: false },
  { id: 'live-3', subject: 'Maths', topic: 'Definite Integration Marathon', instructor: 'GB Sir', startsInHours: 5, viewers: 0, isLive: false },
  { id: 'live-4', subject: 'Physics', topic: 'Modern Physics — Photoelectric Effect', instructor: 'MC Sir', startsInHours: 26, viewers: 0, isLive: false },
  { id: 'live-5', subject: 'Maths', topic: 'Probability Crash Course', instructor: 'RK Mam', startsInHours: 49, viewers: 0, isLive: false },
]

// Doubts
const DOUBT_QS = [
  'Why is angular momentum conserved when no external torque acts?',
  'How do I decide SN1 vs SN2 mechanism quickly in exams?',
  'What is the trick to solve limits of the form 1^∞?',
  'Can someone explain the physical meaning of the work-energy theorem?',
  'Why does electronegativity increase across a period?',
  'How to integrate sec³(x) dx step by step?',
  'Difference between drift velocity and thermal velocity?',
  'When do we use Beer-Lambert law in numericals?',
]
export const doubts = DOUBT_QS.map((q, i) => ({
  id: `doubt-${i + 1}`,
  text: q,
  subject: pick(['Physics', 'Chemistry', 'Maths']),
  asker: `${pick(FIRST)} ${pick(LAST)}`,
  answers: between(0, 6),
  upvotes: between(2, 48),
  hoursAgo: between(1, 72),
  resolved: rand() > 0.5,
  mine: i % 4 === 0,
}))

// Test history (last attempts)
export const testHistory = Array.from({ length: 24 }, (_, i) => {
  const score = Math.round(Math.max(60, Math.min(290, 140 + (rand() - 0.4) * 120)))
  return {
    id: `hist-${i + 1}`,
    name: pick(tests).name,
    type: pick(TEST_TYPES),
    subject: pick(SUBJECT_NAMES),
    daysAgo: i * between(2, 6),
    score,
    total: 300,
    timeTaken: between(72, 178),
    trend: i === 0 ? 0 : score - between(120, 170),
  }
})

// Study-hours series (6 months) — skewed toward evening, declining a bit
export const studyHours = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  hours: round2(2.5 + Math.sin(i / 3) * 1.2 + rand() * 1.6),
}))

export const scoreTrend = Array.from({ length: 12 }, (_, i) => ({
  test: `T${i + 1}`,
  score: Math.round(120 + i * 4 + (rand() - 0.5) * 40),
}))

export const subjectCompletion = SUBJECTS.slice(0, 5).map((s, i) => ({
  subject: s.name,
  value: [71, 55, 48, 40, 33][i],
}))

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
