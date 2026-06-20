'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen,
  Search, Play, Check,
  Sparkles, X, GraduationCap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  GlassCard, Pill, Segmented, EmptyState,
} from '@/components/delta/ui'
import { ScaledPage } from '@/components/delta/scaled-page'
import { useVirtual } from '@/hooks/use-virtual'
import { useStore } from '@/lib/store'
import {
  SUBJECTS, chapters, videos, fmtDuration,
  type SubjectId, type Video,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem, itemTransition } from '@/lib/motion'

const ICONS: Record<string, LucideIcon> = {
  Atom, FlaskConical, Sigma, Dna, Cpu, BookOpen,
}

// Warm subject gradients (kept in sync with the video-player poster map).
const SUBJECT_POSTER: Record<SubjectId, string> = {
  physics: 'from-[oklch(0.34_0.075_62)] via-[oklch(0.22_0.05_62)] to-[oklch(0.12_0.015_62)]',
  chemistry: 'from-[oklch(0.34_0.075_150)] via-[oklch(0.22_0.05_150)] to-[oklch(0.12_0.015_150)]',
  maths: 'from-[oklch(0.34_0.06_250)] via-[oklch(0.22_0.04_250)] to-[oklch(0.12_0.015_250)]',
  biology: 'from-[oklch(0.34_0.075_30)] via-[oklch(0.22_0.05_30)] to-[oklch(0.12_0.015_30)]',
  cs: 'from-[oklch(0.34_0.06_200)] via-[oklch(0.22_0.04_200)] to-[oklch(0.12_0.015_200)]',
  english: 'from-[oklch(0.34_0.055_90)] via-[oklch(0.22_0.04_90)] to-[oklch(0.12_0.015_90)]',
}

type SubjectFilter = 'all' | SubjectId
type StatusFilter = 'all' | 'inprogress' | 'completed' | 'notstarted'
type SortKey = 'default' | 'duration' | 'title' | 'progress'

function chapterTitleOf(video: Video): string {
  return chapters.find((c) => c.id === video.chapterId)?.title ?? ''
}

/* ------------------------------------------------------------------ */
/*  Video card                                                         */
/* ------------------------------------------------------------------ */

function VideoCard({
  video,
  onOpen,
  compact = false,
}: {
  video: Video
  onOpen: () => void
  compact?: boolean
}) {
  const vp = useStore((s) => s.videoProgress[video.id])
  const pct = vp ? Math.round(vp.fraction * 100) : 0
  const subject = SUBJECTS.find((s) => s.id === video.subjectId)
  const SubjectIcon = subject ? ICONS[subject.icon] : null

  return (
    <GlassCard
      hover
      className={cn('group overflow-hidden flex flex-col')}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Play lecture: ${video.title}`}
        className="block w-full text-left focus-visible:outline-none"
      >
        {/* Thumbnail */}
        <div
          className={cn(
            'relative bg-gradient-to-br grid place-items-center overflow-hidden',
            compact ? 'aspect-[16/10]' : 'aspect-video',
            SUBJECT_POSTER[video.subjectId]
          )}
        >
          {/* sheen */}
          <span className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,255,255,0.14),transparent_70%)]" />
          {/* subject watermark icon */}
          {SubjectIcon && (
            <SubjectIcon className="absolute -right-3 -bottom-3 size-20 text-white/8 pointer-events-none" />
          )}
          {/* play button — scales in on hover */}
          <span
            className={cn(
              'relative grid place-items-center rounded-full bg-black/35 backdrop-blur-md border border-white/20',
              'transition-all duration-300 ease-out',
              'opacity-90 group-hover:opacity-100',
              compact ? 'size-11 group-hover:scale-110' : 'size-14 group-hover:scale-110'
            )}
          >
            <Play className={cn('fill-current text-white', compact ? 'size-4 ml-0.5' : 'size-5 ml-0.5')} />
          </span>
          {/* completed check */}
          {vp?.completed && (
            <span className="absolute top-2.5 left-2.5 grid place-items-center size-6 rounded-full bg-primary text-primary-foreground elev-1">
              <Check className="size-3.5" />
            </span>
          )}
          {/* duration badge */}
          <span className="absolute bottom-2.5 right-2.5 text-[11px] tabular font-medium text-white/95 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            {fmtDuration(video.durationSec)}
          </span>
          {/* progress bar */}
          {pct > 0 && !vp?.completed && (
            <span className="absolute bottom-0 inset-x-0 h-1 bg-black/35">
              <span
                className="block h-full bg-primary transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </span>
          )}
        </div>

        {/* Meta */}
        <div className={cn(compact ? 'p-3' : 'p-3.5')}>
          <p className="text-sm font-medium leading-snug line-clamp-2 text-pretty">
            {video.title}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="truncate font-medium text-foreground/80">{video.instructor}</span>
            <span className="size-1 rounded-full bg-muted-foreground/40 shrink-0" />
            <span className="truncate">{chapterTitleOf(video)}</span>
          </div>
          {pct > 0 && !vp?.completed && (
            <p className="mt-1.5 text-[11px] text-primary font-medium tabular">
              {pct}% watched
            </p>
          )}
        </div>
      </button>
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Library page                                                       */
/* ------------------------------------------------------------------ */

export function LibraryPage() {
  const vp = useStore((s) => s.videoProgress)
  const openTheater = useStore((s) => s.openTheater)
  const reduce = useReducedMotion() ?? false

  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('default')
  const [query, setQuery] = useState('')

  const totalContentHours = useMemo(
    () => Math.round(videos.reduce((sum, v) => sum + v.durationSec, 0) / 3600),
    []
  )
  const completedCount = useMemo(
    () => videos.filter((v) => vp[v.id]?.completed).length,
    [vp]
  )

  // Continue watching: in-progress, not completed.
  const continueWatching = useMemo(() => {
    return videos
      .filter((v) => {
        const p = vp[v.id]
        return p && !p.completed && p.fraction > 0
      })
      .sort((a, b) => (vp[b.id]?.fraction ?? 0) - (vp[a.id]?.fraction ?? 0))
      .slice(0, 8)
  }, [vp])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = videos.slice()

    if (subjectFilter !== 'all') {
      list = list.filter((v) => v.subjectId === subjectFilter)
    }

    if (q) {
      list = list.filter((v) => {
        const chapter = chapterTitleOf(v).toLowerCase()
        return (
          v.title.toLowerCase().includes(q) ||
          v.instructor.toLowerCase().includes(q) ||
          chapter.includes(q)
        )
      })
    }

    if (statusFilter !== 'all') {
      list = list.filter((v) => {
        const p = vp[v.id]
        if (statusFilter === 'completed') return !!p?.completed
        if (statusFilter === 'inprogress') return !!p && !p.completed && p.fraction > 0
        if (statusFilter === 'notstarted') return !p || p.fraction === 0
        return true
      })
    }

    switch (sort) {
      case 'duration':
        list.sort((a, b) => b.durationSec - a.durationSec)
        break
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'progress':
        list.sort((a, b) => (vp[b.id]?.fraction ?? 0) - (vp[a.id]?.fraction ?? 0))
        break
      case 'default':
      default:
        // Keep deterministic chapter-then-number order from the source data.
        list.sort((a, b) => {
          const ca = chapters.find((c) => c.id === a.chapterId)?.number ?? 0
          const cb = chapters.find((c) => c.id === b.chapterId)?.number ?? 0
          return ca - cb || a.number - b.number
        })
        break
    }

    return list
  }, [subjectFilter, statusFilter, sort, query, vp])

  const subtitle = `${videos.length} lectures · ${totalContentHours}h of content · ${completedCount} completed`

  // Virtualize the video grid by row. At the 1440px design width the grid is 4
  // columns; each card row is ~230px. We window-render rows so 360 videos (90
  // rows) don't all mount at once.
  const COLS = 4
  const rowCount = Math.ceil(filtered.length / COLS)
  const { containerRef: gridRef, visibleRange: gridRange, totalHeight: gridTotalH, offsetY: gridOffsetY } = useVirtual(rowCount, 230, 4)
  const [gStart, gEnd] = gridRange
  const visibleFiltered = filtered.slice(gStart * COLS, (gEnd + 1) * COLS)

  return (
    <ScaledPage>
      <motion.div
        className="flex flex-col gap-5 px-5 py-5 max-w-[1600px] mx-auto"
        variants={staggerContainer(reduce)}
        initial="initial"
        animate="animate"
      >
        {/* Continue watching rail */}
        {continueWatching.length > 0 && (
          <motion.section
            variants={staggerItem(reduce)}
            transition={itemTransition(reduce)}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-tight">Continue watching</h2>
              </div>
              <span className="text-[11px] text-muted-foreground tabular">
                {continueWatching.length} in progress
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto scroll-thin pb-2 -mx-1 px-1">
              {continueWatching.map((v) => (
                <div key={v.id} className="w-[260px] shrink-0">
                  <VideoCard video={v} onOpen={() => openTheater(v.id)} compact />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Toolbar */}
        <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lectures, instructors, chapters…"
                aria-label="Search library"
                className="w-full rounded-full bg-white/5 border border-border pl-9 pr-9 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-white/[0.07]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Segmented
              options={[
                { value: 'default', label: 'Chapter' },
                { value: 'duration', label: 'Longest' },
                { value: 'progress', label: 'Progress' },
                { value: 'title', label: 'A–Z' },
              ]}
              value={sort}
              onChange={setSort}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scroll-none pb-1">
            <Pill
              active={subjectFilter === 'all'}
              onClick={() => setSubjectFilter('all')}
            >
              All subjects
            </Pill>
            {SUBJECTS.map((s) => {
              const Icon = ICONS[s.icon]
              const subVids = videos.filter((v) => v.subjectId === s.id)
              const done = subVids.filter((v) => vp[v.id]?.completed).length
              return (
                <Pill
                  key={s.id}
                  active={subjectFilter === s.id}
                  onClick={() => setSubjectFilter(s.id)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {Icon && <Icon className="size-3.5" style={{ color: s.color }} />}
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-60 tabular">{done}/{subVids.length}</span>
                  </span>
                </Pill>
              )
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mr-1">
              Status
            </span>
            {([
              ['all', 'Any'],
              ['inprogress', 'In progress'],
              ['completed', 'Completed'],
              ['notstarted', 'Not started'],
            ] as const).map(([v, l]) => (
              <Pill
                key={v}
                active={statusFilter === v}
                onClick={() => setStatusFilter(v)}
              >
                {l}
              </Pill>
            ))}
          </div>
        </motion.div>

        {/* Grid header + grid */}
        <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              {subjectFilter === 'all'
                ? 'All lectures'
                : `${SUBJECTS.find((s) => s.id === subjectFilter)?.name} lectures`}
            </h2>
            <span className="text-[11px] text-muted-foreground tabular">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {/* Grid — virtualized by row (360 videos → ~visible window only) */}
          {filtered.length === 0 ? (
            <GlassCard className="p-8 mt-3">
              <EmptyState
                icon={<GraduationCap className="size-6" />}
                title="No lectures match"
                hint="Try a different subject, status, or search term."
              />
            </GlassCard>
          ) : (
            <div ref={gridRef} className="overflow-y-auto scroll-thin mt-3 pb-6" style={{ maxHeight: 'min(70vh, 620px)' }}>
              <div style={{ height: gridTotalH, position: 'relative' }}>
                <div
                  className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4 gap-4"
                  style={{ transform: `translateY(${gridOffsetY}px)` }}
                >
                  {visibleFiltered.map((v) => (
                    <VideoCard key={v.id} video={v} onOpen={() => openTheater(v.id)} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </ScaledPage>
  )
}
