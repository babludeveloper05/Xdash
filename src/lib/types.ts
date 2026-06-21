/**
 * Shared type definitions for Project Delta.
 *
 * Previously lived in mock-data.ts — extracted here so the app doesn't depend
 * on mock data for its type contracts. All pages and the store import from here.
 */

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
  subjectId: string
  number: number
  title: string
  topicCount: number
  durationMin: number
}

export interface Video {
  id: string
  chapterId: string
  subjectId: string
  number: number
  title: string
  instructor: string
  durationSec: number
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
  progress: number
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
