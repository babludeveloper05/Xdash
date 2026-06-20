'use client'

import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  videos,
  chapters,
  SUBJECTS,
  notes as seedNotes,
  testHistory as seedHistory,
  type NoteItem,
  type SubjectId,
} from './mock-data'

export type TabId =
  | 'home'
  | 'library'
  | 'tests'
  | 'notes'
  | 'live'
  | 'analytics'
  | 'leaderboard'
  | 'achievements'
  | 'profile'
  | 'settings'
  | 'syllabus'
  | 'doubts'
  | 'playground'

export interface UserProfile {
  name: string
  location: string
  bio: string
  targetYear: string
  batch: string
  examName: string
}

/** Notification preferences — persisted so toggles survive reloads. */
export interface NotifState {
  live: boolean
  tests: boolean
  streak: boolean
  weekly: boolean
}

export interface WidgetState {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  z: number
}

export interface VideoProgress {
  fraction: number // 0..1
  completed: boolean
}

export interface HistoryRow {
  id: string
  name: string
  type: string
  subject: string
  daysAgo: number
  score: number
  total: number
  timeTaken: number
  trend: number
}

// --- seed deterministic initial progress ---
// Each subject gets a distinct target completion so the dashboard reflects a
// believable learning journey (earlier chapters finished first, mastery
// declining across subjects) instead of an identical value everywhere.
const SUBJECT_TARGET: Record<SubjectId, number> = {
  physics: 0.71,
  chemistry: 0.55,
  maths: 0.48,
  biology: 0.4,
  cs: 0.33,
  english: 0.25,
}

function seedProgress(): Record<string, VideoProgress> {
  const map: Record<string, VideoProgress> = {}
  SUBJECTS.forEach((sub) => {
    const subVideos = videos
      .filter((v) => v.subjectId === sub.id)
      // earlier chapters (then earlier videos) are completed first
      .sort((a, b) => {
        const ca = chapters.find((c) => c.id === a.chapterId)!.number
        const cb = chapters.find((c) => c.id === b.chapterId)!.number
        return ca - cb || a.number - b.number
      })
    const target = SUBJECT_TARGET[sub.id] ?? 0.4
    const completeCount = Math.round(subVideos.length * target)
    // a small "in progress" frontier just past the completed boundary
    const partialCount = Math.min(3, subVideos.length - completeCount)
    subVideos.forEach((v, i) => {
      if (i < completeCount) {
        map[v.id] = { fraction: 1, completed: true }
      } else if (i < completeCount + partialCount) {
        map[v.id] = { fraction: 0.35, completed: false }
      } else {
        map[v.id] = { fraction: 0, completed: false }
      }
    })
  })
  return map
}

const DEFAULT_WIDGETS: WidgetState[] = [
  { id: 'w-greeting', type: 'greeting', x: 24, y: 24, w: 1124, h: 96, z: 1 },
  { id: 'w-live', type: 'liveStatus', x: 1164, y: 24, w: 260, h: 96, z: 1 },
  { id: 'w-streak', type: 'streak', x: 24, y: 140, w: 220, h: 224, z: 1 },
  { id: 'w-countdown-class', type: 'nextClass', x: 264, y: 140, w: 280, h: 224, z: 1 },
  { id: 'w-goal', type: 'dailyGoal', x: 564, y: 140, w: 220, h: 224, z: 1 },
  { id: 'w-rings', type: 'subjectRings', x: 804, y: 140, w: 360, h: 224, z: 1 },
  { id: 'w-rank', type: 'batchRank', x: 1184, y: 140, w: 240, h: 224, z: 1 },
  { id: 'w-tests', type: 'testDue', x: 24, y: 384, w: 280, h: 264, z: 1 },
  { id: 'w-notes', type: 'quickNotes', x: 324, y: 384, w: 280, h: 264, z: 1 },
  { id: 'w-leader', type: 'leaderPeek', x: 624, y: 384, w: 260, h: 264, z: 1 },
  { id: 'w-activity', type: 'recentActivity', x: 904, y: 384, w: 260, h: 264, z: 1 },
  { id: 'w-custom', type: 'customCountdown', x: 1184, y: 384, w: 240, h: 264, z: 1 },
]

/**
 * Nav order used for direction calculation. Mirrors the `TABS` array in
 * `top-nav.tsx` so clicking a tab and arrow-keying produce consistent,
 * legible direction. Tabs outside this list (syllabus / doubts / playground —
 * reachable via Spotlight / Settings) default to forward motion.
 */
export const TAB_ORDER: TabId[] = [
  'home', 'library', 'tests', 'notes', 'live', 'analytics',
  'leaderboard', 'achievements', 'profile', 'settings',
]

interface DeltaState {
  activeTab: TabId
  /** 1 = forward (right in nav), -1 = backward (left). Drives page transitions. */
  direction: 1 | -1
  setTab: (t: TabId) => void
  cycleTab: (dir: -1 | 1) => void

  spotlightOpen: boolean
  setSpotlight: (v: boolean) => void

  onboardingDone: boolean
  finishOnboarding: () => void

  // user profile
  profile: UserProfile
  setProfile: (patch: Partial<UserProfile>) => void

  // notification preferences
  notifications: NotifState
  setNotifications: (patch: Partial<NotifState>) => void

  // progress
  videoProgress: Record<string, VideoProgress>
  setVideoProgress: (id: string, fraction: number) => void
  markVideoComplete: (id: string) => void
  subjectProgress: () => Record<SubjectId, number>
  totalHours: () => number

  // streak / goals
  streak: number
  dailyGoalHours: number
  hoursToday: number
  setDailyGoal: (h: number) => void
  addStudyHours: (h: number) => void
  customCountdownDate: string
  countdownLabel: string
  setCountdown: (label: string, date: string) => void

  // notes
  notes: NoteItem[]
  addNote: (n: Omit<NoteItem, 'id' | 'updatedAt'>) => void
  updateNote: (id: string, n: Partial<NoteItem>) => void
  deleteNote: (id: string) => void
  quickScratch: string
  setQuickScratch: (s: string) => void

  // tests
  history: HistoryRow[]
  submitTest: (row: Omit<HistoryRow, 'id' | 'daysAgo'>) => void

  // widgets
  widgets: WidgetState[]
  gridMode: boolean
  setGridMode: (v: boolean) => void
  updateWidget: (id: string, patch: Partial<WidgetState>) => void
  bringToFront: (id: string) => void
  removeWidget: (id: string) => void
  addWidget: (type: string) => void
  resetWidgets: () => void

  // video modal / pip
  theaterVideoId: string | null
  pipVideoId: string | null
  openTheater: (id: string) => void
  closeTheater: () => void
  enterPip: () => void
  closePip: () => void
  restoreFromPip: () => void

  // live
  liveAttended: boolean
  setLiveAttended: (v: boolean) => void
}

export const useStore = create<DeltaState>()(
  persist(
    (set, get) => ({
      activeTab: 'home',
      direction: 1,
      setTab: (t) =>
        set((s) => {
          if (t === s.activeTab) return {} // no-op: keep current direction
          const oldIdx = TAB_ORDER.indexOf(s.activeTab)
          const newIdx = TAB_ORDER.indexOf(t)
          // Tabs outside TAB_ORDER (syllabus/doubts/playground) default forward.
          const direction: 1 | -1 =
            oldIdx === -1 || newIdx === -1 ? 1 : newIdx >= oldIdx ? 1 : -1
          return { activeTab: t, direction }
        }),
      cycleTab: (dir) => {
        const i = TAB_ORDER.indexOf(get().activeTab)
        // If the current tab isn't in the nav order (e.g. playground), anchor
        // from home so cycling still lands somewhere sensible.
        const anchor = i === -1 ? 0 : i
        const next = TAB_ORDER[(anchor + dir + TAB_ORDER.length) % TAB_ORDER.length]
        set({ activeTab: next, direction: dir })
      },

      spotlightOpen: false,
      setSpotlight: (v) => set({ spotlightOpen: v }),

      onboardingDone: false,
      finishOnboarding: () => set({ onboardingDone: true }),

      profile: {
        name: 'Aryan Sharma',
        location: 'Kota, Rajasthan',
        bio: 'Aiming for a top rank. Building consistent study habits one day at a time.',
        targetYear: '2027',
        batch: 'Nucleus 2026',
        examName: 'My Exam',
      },
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      notifications: { live: true, tests: true, streak: true, weekly: false },
      setNotifications: (patch) =>
        set((s) => ({ notifications: { ...s.notifications, ...patch } })),

      videoProgress: seedProgress(),
      setVideoProgress: (id, fraction) =>
        set((s) => ({
          videoProgress: {
            ...s.videoProgress,
            [id]: {
              fraction,
              completed: fraction >= 0.98 || (s.videoProgress[id]?.completed ?? false),
            },
          },
        })),
      markVideoComplete: (id) =>
        set((s) => ({
          videoProgress: { ...s.videoProgress, [id]: { fraction: 1, completed: true } },
          hoursToday: s.hoursToday + 0.5,
        })),
      subjectProgress: () => {
        const vp = get().videoProgress
        const out = {} as Record<SubjectId, number>
        SUBJECTS.forEach((sub) => {
          const subVideos = videos.filter((v) => v.subjectId === sub.id)
          const done = subVideos.filter((v) => vp[v.id]?.completed).length
          out[sub.id] = subVideos.length ? done / subVideos.length : 0
        })
        return out
      },
      totalHours: () => {
        const vp = get().videoProgress
        return Math.round(
          videos.reduce((acc, v) => acc + (vp[v.id]?.fraction ?? 0) * (v.durationSec / 3600), 0)
        )
      },

      streak: 23,
      dailyGoalHours: 6,
      hoursToday: 3.5,
      customCountdownDate: '2027-01-24',
      countdownLabel: 'Exam Day',
      setDailyGoal: (h) => set({ dailyGoalHours: h }),
      addStudyHours: (h) => set((s) => ({ hoursToday: Math.min(s.dailyGoalHours + 2, s.hoursToday + h) })),
      setCountdown: (label, date) => set({ countdownLabel: label, customCountdownDate: date }),

      notes: seedNotes,
      addNote: (n) =>
        set((s) => ({
          notes: [{ ...n, id: `note-${Date.now()}`, updatedAt: Date.now() }, ...s.notes],
        })),
      updateNote: (id, n) =>
        set((s) => ({
          notes: s.notes.map((x) => (x.id === id ? { ...x, ...n, updatedAt: Date.now() } : x)),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((x) => x.id !== id) })),
      quickScratch: '',
      setQuickScratch: (str) => set({ quickScratch: str }),

      history: seedHistory as HistoryRow[],
      submitTest: (row) =>
        set((s) => ({
          history: [{ ...row, id: `hist-${Date.now()}`, daysAgo: 0 }, ...s.history],
        })),

      widgets: DEFAULT_WIDGETS,
      gridMode: false,
      setGridMode: (v) => set({ gridMode: v }),
      updateWidget: (id, patch) =>
        set((s) => ({ widgets: s.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
      bringToFront: (id) =>
        set((s) => {
          const maxZ = Math.max(...s.widgets.map((w) => w.z))
          return { widgets: s.widgets.map((w) => (w.id === id ? { ...w, z: maxZ + 1 } : w)) }
        }),
      removeWidget: (id) => set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) })),
      addWidget: (type) =>
        set((s) => {
          const maxZ = s.widgets.length ? Math.max(...s.widgets.map((w) => w.z)) : 1
          return {
            widgets: [
              ...s.widgets,
              { id: `w-${type}-${Date.now()}`, type, x: 80, y: 200, w: 260, h: 220, z: maxZ + 1 },
            ],
          }
        }),
      resetWidgets: () => set({ widgets: DEFAULT_WIDGETS, gridMode: false }),

      theaterVideoId: null,
      pipVideoId: null,
      openTheater: (id) => set({ theaterVideoId: id, pipVideoId: null }),
      closeTheater: () => set({ theaterVideoId: null }),
      enterPip: () => set((s) => ({ pipVideoId: s.theaterVideoId, theaterVideoId: null })),
      closePip: () => set({ pipVideoId: null }),
      restoreFromPip: () => set((s) => ({ theaterVideoId: s.pipVideoId, pipVideoId: null })),

      liveAttended: false,
      setLiveAttended: (v) => set({ liveAttended: v }),
    }),
    {
      name: 'project-delta-v1',
      partialize: (s) => ({
        videoProgress: s.videoProgress,
        streak: s.streak,
        dailyGoalHours: s.dailyGoalHours,
        hoursToday: s.hoursToday,
        customCountdownDate: s.customCountdownDate,
        countdownLabel: s.countdownLabel,
        notes: s.notes,
        quickScratch: s.quickScratch,
        history: s.history,
        widgets: s.widgets,
        gridMode: s.gridMode,
        onboardingDone: s.onboardingDone,
        liveAttended: s.liveAttended,
        profile: s.profile,
        notifications: s.notifications,
      }),
    }
  )
)

// --- Derived selectors -------------------------------------------------------
// These compute objects/values from state. They must be memoized against the
// underlying `videoProgress` slice; calling the raw store getters inside a
// selector returns a fresh reference each render and triggers an infinite loop.

export function useSubjectProgress(): Record<SubjectId, number> {
  const vp = useStore((s) => s.videoProgress)
  return useMemo(() => useStore.getState().subjectProgress(), [vp])
}

export function useTotalHours(): number {
  const vp = useStore((s) => s.videoProgress)
  return useMemo(() => useStore.getState().totalHours(), [vp])
}
