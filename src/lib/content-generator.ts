/**
 * Content generator — produces all learning entities (subjects, chapters,
 * videos, tests, questions, leaderboard, live sessions, achievements) from
 * a user's subject list + track.
 *
 * This is what makes the app truly universal: a Software Developer with
 * subjects ["Data Structures", "Algorithms", "System Design"] gets content
 * generated for those subjects using the professional content pack, while a
 * JEE aspirant with ["Physics", "Chemistry", "Maths"] gets academic-flavored
 * content.
 *
 * The generation is deterministic (seeded PRNG) so content is stable across
 * reloads — same subjects + track always produce the same chapters/videos/tests.
 */

import { getTrackPack } from './content-packs'
import type { SubjectId } from './mock-data'
import { subjectStyle } from './subjects'

// --- Deterministic PRNG (same algorithm as mock-data.ts) ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Seed from a string (subject list + track) so different users get different
// but stable content.
function seedFromString(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

// --- Types (re-exported from mock-data for compatibility) ---
export interface GeneratedSubject {
  id: string
  name: string
  icon: string
  color: string
}

export interface GeneratedChapter {
  id: string
  subjectId: string
  number: number
  title: string
  topicCount: number
  durationMin: number
}

export interface GeneratedVideo {
  id: string
  chapterId: string
  subjectId: string
  number: number
  title: string
  instructor: string
  durationSec: number
}

export interface GeneratedTest {
  id: string
  name: string
  type: string
  subject: string
  questionCount: number
  durationMin: number
  deadlineHours: number | null
  difficulty: 'Easy' | 'Moderate' | 'Hard'
}

export interface GeneratedContent {
  subjects: GeneratedSubject[]
  chapters: GeneratedChapter[]
  videos: GeneratedVideo[]
  tests: GeneratedTest[]
  liveSessions: Array<{ id: string; subject: string; topic: string; instructor: string; startsInHours: number; viewers: number; isLive: boolean }>
  achievements: Array<{ id: string; title: string; description: string; category: string; rarity: string; icon: string; earned: boolean; earnedAt: string | null; progress: number }>
  studyHours: Array<{ day: string; hours: number }>
  scoreTrend: Array<{ test: string; score: number }>
}

// --- Subject icon/color mapping ---
const SUBJECT_ICONS: Record<string, string> = {
  physics: 'Atom', chemistry: 'FlaskConical', maths: 'Sigma', biology: 'Dna',
  cs: 'Cpu', english: 'BookOpen',
  'data structures': 'Database', algorithms: 'Code2', 'system design': 'LayoutGrid',
  databases: 'Database', 'machine learning': 'Brain', 'deep learning': 'Brain',
  python: 'Code2', statistics: 'Sigma',
  'ui/ux': 'Palette', typography: 'Type', 'color theory': 'Palette',
  'motion design': 'Zap', 'product strategy': 'Briefcase', analytics: 'BarChart3',
  'user research': 'Users', roadmapping: 'Map',
  accounting: 'Calculator', markets: 'TrendingUp', excel: 'Grid3x3', strategy: 'Briefcase',
  seo: 'Search', content: 'PenLine', 'paid media': 'Megaphone',
  linux: 'Terminal', aws: 'Cloud', kubernetes: 'Boxes', 'ci/cd': 'GitBranch',
  polity: 'Landmark', history: 'Scroll', geography: 'Map', economy: 'TrendingUp',
  'current affairs': 'Newspaper',
  vocabulary: 'BookOpen', grammar: 'Languages', speaking: 'Mic', listening: 'Headphones',
  nutrition: 'Apple', training: 'Dumbbell', recovery: 'HeartPulse', mindfulness: 'Brain',
  plot: 'PenLine', character: 'Users', prose: 'PenLine', poetry: 'Music',
  theory: 'Music', practice: 'Mic', composition: 'Music', 'ear training': 'Headphones',
}

function subjectIconFor(name: string): string {
  const key = name.toLowerCase().trim()
  return SUBJECT_ICONS[key] ?? 'BookOpen'
}

// --- Main generator ---
export function generateContent(subjects: string[], track: string): GeneratedContent {
  const pack = getTrackPack(track)
  const seed = seedFromString(subjects.join(',') + '|' + track)
  const rand = mulberry32(seed)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
  const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

  // Generate subjects
  const genSubjects: GeneratedSubject[] = subjects.map((name, i) => {
    const id = name.toLowerCase().trim().replace(/\s+/g, '-')
    const style = subjectStyle(id)
    return {
      id,
      name,
      icon: subjectIconFor(name),
      color: style.tone,
    }
  })

  // Generate chapters + videos
  const genChapters: GeneratedChapter[] = []
  const genVideos: GeneratedVideo[] = []

  genSubjects.forEach((subject) => {
    const chapterCount = between(8, 12)
    for (let ci = 0; ci < chapterCount; ci++) {
      const chapterId = `${subject.id}-c${ci + 1}`
      const topic = pack.chapterTopics[ci % pack.chapterTopics.length]
      genChapters.push({
        id: chapterId,
        subjectId: subject.id,
        number: ci + 1,
        title: topic,
        topicCount: 5,
        durationMin: between(90, 220),
      })

      const videoCount = 5
      for (let vi = 0; vi < videoCount; vi++) {
        const videoTopic = pack.videoTopics[vi % pack.videoTopics.length]
        genVideos.push({
          id: `${chapterId}-v${vi + 1}`,
          chapterId,
          subjectId: subject.id,
          number: vi + 1,
          title: `${topic}: ${videoTopic}`,
          instructor: pick(pack.instructors),
          durationSec: between(18, 62) * 60,
        })
      }
    }
  })

  // Generate tests
  const genTests: GeneratedTest[] = Array.from({ length: Math.max(30, subjects.length * 8) }, (_, i) => {
    const type = pack.testTypes[i % pack.testTypes.length]
    const subject = pick(subjects)
    const difficulty = pick(pack.difficulties)
    const hasDeadline = rand() > 0.3
    return {
      id: `test-${i + 1}`,
      name: `${type} ${String(i + 1).padStart(2, '0')} — ${subject}`,
      type,
      subject,
      questionCount: type === 'Coding Challenge' || type === 'Mock Interview' ? between(5, 15) : between(20, 60),
      durationMin: between(30, 180),
      deadlineHours: hasDeadline ? between(2, 96) : null,
      difficulty,
    }
  })

  // Generate live sessions
  const genLive = genSubjects.slice(0, 5).map((s, i) => ({
    id: `live-${i + 1}`,
    subject: s.name,
    topic: `${pick(pack.chapterTopics)} — ${s.name}`,
    instructor: pick(pack.instructors),
    startsInHours: i === 0 ? 0 : between(2, 48),
    viewers: i === 0 ? between(200, 2000) : 0,
    isLive: i === 0,
  }))

  // Generate achievements (track-aware)
  const flavor = pack.flavor
  const achievements = [
    { title: 'First Steps', description: `Complete your first ${flavor === 'professional' ? 'project' : 'lesson'}`, category: 'Study Streak', rarity: 'Common', icon: 'Sparkles', progress: 1 },
    { title: 'Week Warrior', description: 'Maintain a 7-day streak', category: 'Study Streak', rarity: 'Common', icon: 'Flame', progress: 0.85 },
    { title: 'Month Master', description: 'Maintain a 30-day streak', category: 'Study Streak', rarity: 'Rare', icon: 'Trophy', progress: 0.4 },
    { title: 'Test Taker', description: 'Complete 10 tests', category: 'Test Mastery', rarity: 'Common', icon: 'FileText', progress: 0.6 },
    { title: 'Top Scorer', description: 'Score 90%+ on a test', category: 'Test Mastery', rarity: 'Rare', icon: 'Target', progress: 0.3 },
    { title: 'Subject Expert', description: `Master a ${flavor === 'professional' ? 'skill' : 'subject'} completely`, category: 'Subject Expert', rarity: 'Epic', icon: 'Award', progress: 0.5 },
    { title: 'Doubt Solver', description: 'Resolve 100 doubts', category: 'Special', rarity: 'Rare', icon: 'MessageCircleQuestion', progress: 0.2 },
    { title: 'Night Owl', description: 'Study after 10 PM 5 times', category: 'Special', rarity: 'Common', icon: 'Moon', progress: 0.8 },
    { title: 'Early Bird', description: 'Study before 7 AM 5 times', category: 'Special', rarity: 'Common', icon: 'Sunrise', progress: 0.4 },
    { title: 'Consistency King', description: '100-day streak', category: 'Study Streak', rarity: 'Legendary', icon: 'Crown', progress: 0.23 },
    { title: flavor === 'professional' ? 'Code Master' : 'Scholar', description: `Complete 50 ${flavor === 'professional' ? 'coding challenges' : 'chapters'}`, category: 'Subject Expert', rarity: 'Epic', icon: 'Sigma', progress: 0.65 },
    { title: 'Marathon Runner', description: 'Study 6+ hours in one day', category: 'Study Streak', rarity: 'Rare', icon: 'Zap', progress: 0.9 },
  ].map((a, i) => ({
    id: `ach-${i + 1}`,
    ...a,
    earned: a.progress >= 1,
    earnedAt: a.progress >= 1 ? '2026-06-15' : null,
  }))

  // Generate study hours (30 days)
  const studyHours = Array.from({ length: 30 }, (_, i) => ({
    day: `D${i + 1}`,
    hours: between(2, 9) + Math.round(rand() * 10) / 10,
  }))

  // Generate score trend (12 tests)
  const scoreTrend = Array.from({ length: 12 }, (_, i) => ({
    test: `T${i + 1}`,
    score: between(55, 95),
  }))

  return {
    subjects: genSubjects,
    chapters: genChapters,
    videos: genVideos,
    tests: genTests,
    liveSessions: genLive,
    achievements,
    studyHours,
    scoreTrend,
  }
}
