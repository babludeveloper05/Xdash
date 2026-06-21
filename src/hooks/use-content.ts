'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { generateContent, type GeneratedContent } from '@/lib/content-generator'

/**
 * useContent — returns track-aware generated content for the current user.
 *
 * Reads the user's profile.subjects + profile.track from the store and
 * generates all learning entities (subjects, chapters, videos, tests, live
 * sessions, achievements, study hours, score trend) via the content generator.
 *
 * The content is memoized against the subject list + track so it's stable
 * across re-renders but regenerates when the user changes their subjects.
 *
 * Pages call this instead of importing from mock-data.ts directly. A Software
 * Developer sees DSA/Algorithms content; a JEE aspirant sees Physics/Chemistry
 * content — same pages, different data.
 */
export function useContent(): GeneratedContent {
  const subjects = useStore((s) => s.profile.subjects)
  const track = useStore((s) => s.profile.track)

  return useMemo(() => {
    // Fall back to the default science subjects if the user has none set
    // (pre-onboarding or legacy users).
    const subjectList = subjects.length > 0
      ? subjects
      : ['Physics', 'Chemistry', 'Maths']
    const effectiveTrack = track || 'Student'

    return generateContent(subjectList, effectiveTrack)
  }, [subjects, track])
}
