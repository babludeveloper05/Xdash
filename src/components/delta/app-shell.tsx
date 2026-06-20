'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useStore } from '@/lib/store'
import { TopNav } from './top-nav'
import { Spotlight } from './spotlight'
import { Onboarding } from './onboarding'
import { VideoLayer } from './video-player'
import { HomePage } from './pages/home'
import { LibraryPage } from './pages/library'
import { TestsPage } from './pages/tests'
import { NotesPage } from './pages/notes'
import { LivePage } from './pages/live'
import { AnalyticsPage } from './pages/analytics'
import { LeaderboardPage } from './pages/leaderboard'
import { AchievementsPage } from './pages/achievements'
import { ProfilePage } from './pages/profile'
import { SettingsPage } from './pages/settings'
import { SyllabusPage } from './pages/syllabus'
import { DoubtsPage } from './pages/doubts'
import { PlaygroundPage } from './pages/playground'
import { Triangle } from 'lucide-react'
import {
  pageVariants,
  parallaxBgVariants,
  pageTransition,
  type PageTransitionCtx,
} from '@/lib/motion'

function ActivePage() {
  const tab = useStore((s) => s.activeTab)
  switch (tab) {
    case 'home': return <HomePage />
    case 'library': return <LibraryPage />
    case 'tests': return <TestsPage />
    case 'notes': return <NotesPage />
    case 'live': return <LivePage />
    case 'analytics': return <AnalyticsPage />
    case 'leaderboard': return <LeaderboardPage />
    case 'achievements': return <AchievementsPage />
    case 'profile': return <ProfilePage />
    case 'settings': return <SettingsPage />
    case 'syllabus': return <SyllabusPage />
    case 'doubts': return <DoubtsPage />
    case 'playground': return <PlaygroundPage />
    default: return <HomePage />
  }
}

export function AppShell() {
  const cycleTab = useStore((s) => s.cycleTab)
  const activeTab = useStore((s) => s.activeTab)
  const direction = useStore((s) => s.direction)
  const spotlightOpen = useStore((s) => s.spotlightOpen)
  const theaterVideoId = useStore((s) => s.theaterVideoId)
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Scroll progress for the parallax progress bar. Tracks the main scroll
  // container via a manual listener (SSR-safe — framer-motion's useScroll
  // with a container ref has timing issues during hydration). The motion
  // value is spring-smoothed so the bar glides rather than jumps.
  const mainRef = useRef<HTMLElement>(null)
  const scrollProgress = useMotionValue(0)
  const progressScaleX = useSpring(scrollProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  })
  // Parallax drift for the ambient glow during scroll — shifts at a fraction
  // of the scroll progress so the background appears to lag behind content.
  const bgScrollY = useTransform(progressScaleX, [0, 1], [0, prefersReduced ? 0 : 60])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      scrollProgress.set(max > 0 ? el.scrollTop / max : 0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollProgress, activeTab])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
      if (typing || spotlightOpen || theaterVideoId) return
      if (e.key === 'ArrowRight') cycleTab(1)
      if (e.key === 'ArrowLeft') cycleTab(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cycleTab, spotlightOpen, theaterVideoId])

  if (!mounted) {
    return (
      <div className="ambient fixed inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="grid place-items-center size-12 rounded-2xl bg-primary text-primary-foreground elev-2">
            <Triangle className="size-6 fill-current" />
          </span>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.2s]" />
            <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.1s]" />
            <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" />
          </div>
        </div>
      </div>
    )
  }

  // Direction + reduced-motion context shared by both the entering and the
  // exiting page so the sweep is continuous (no dead frame between them).
  const ctx: PageTransitionCtx = { dir: direction, reduce: prefersReduced ?? false }

  return (
    <div className="ambient fixed inset-0 flex flex-col">
      {/* Scroll progress bar — springs along the top of the content area.
          Parallax-adjacent: visualises how far through the page you've scrolled. */}
      <motion.div
        className="absolute top-16 left-0 right-0 h-[2px] bg-primary/70 origin-left z-40 pointer-events-none"
        style={{ scaleX: progressScaleX }}
        aria-hidden
      />
      {/* Scroll parallax ambient glow — drifts downward as you scroll so the
          background reads as a deeper layer behind the content. */}
      <motion.div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          y: bgScrollY,
          background:
            'radial-gradient(80% 50% at 20% 10%, oklch(0.32 0.04 60 / 0.18) 0%, transparent 60%), radial-gradient(60% 40% at 85% 90%, oklch(0.28 0.03 55 / 0.14) 0%, transparent 55%)',
        }}
        aria-hidden
      />
      <TopNav />
      {/*
        Default `sync` mode (not `wait`) keeps the outgoing page mounted while
        the incoming one animates in — overlap, no cut. Both pages are
        absolutely positioned so they stack naturally during the handoff.

        A parallax background layer sits BEHIND each page inside the same
        AnimatePresence. It uses `parallaxBgVariants` which drift at ~0.35x
        the page slide rate — so during a transition the foreground moves
        fast and the background moves slow, creating multi-layer parallax
        depth (the core parallax illusion).
      */}
      <AnimatePresence custom={ctx} initial={false}>
        <motion.div
          key={`bg-${activeTab}`}
          custom={ctx}
          variants={parallaxBgVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition(ctx.reduce)}
          className="absolute inset-0 pointer-events-none -z-10"
          aria-hidden
        />
        <motion.main
          ref={mainRef}
          key={activeTab}
          custom={ctx}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition(ctx.reduce)}
          className="absolute inset-x-0 bottom-0 top-16 overflow-y-auto overflow-x-hidden scroll-thin"
        >
          <ActivePage />
        </motion.main>
      </AnimatePresence>
      <Spotlight />
      <Onboarding />
      <VideoLayer />
    </div>
  )
}
