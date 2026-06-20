'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  MessageCircleQuestion, Plus, ArrowBigUp, MessageSquare, CheckCircle2,
  Search, Send, X, Clock, ChevronDown, CircleDot, Sparkles, AlertCircle,
} from 'lucide-react'
import {
  GlassCard, PageHeader, Pill, Avatar, EmptyState,
  PrimaryButton, GhostButton, Badge, Segmented,
} from '@/components/delta/ui'
import { doubts as seedDoubts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem, itemTransition } from '@/lib/motion'

type FilterKey = 'all' | 'mine' | 'resolved' | 'open'
type SortKey = 'recent' | 'top'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'My Doubts' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'open', label: 'Open' },
]

const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Maths'] as const

/* Mock answers reused for any expandable doubt — purely visual. */
const MOCK_ANSWERS = [
  {
    author: 'NV Sir',
    role: 'Faculty',
    text:
      'Great question. Angular momentum is conserved because the net external torque is zero — only internal forces act, and they always come in equal-opposite pairs that produce cancelling torques about the same axis.',
    hoursAgo: 3,
    helpful: 12,
  },
  {
    author: 'Diya Mehta',
    role: 'Student',
    text:
      "Think of it like this: if no one pushes the spinning wheel from outside, it just keeps spinning the same way. L = Iω stays constant. Same reason Earth keeps rotating.",
    hoursAgo: 6,
    helpful: 5,
  },
]

interface Doubt {
  id: string
  text: string
  subject: string
  asker: string
  answers: number
  upvotes: number
  hoursAgo: number
  resolved: boolean
  mine: boolean
}

const SUBJECT_TONE: Record<string, string> = {
  Physics: 'oklch(0.78 0.14 62)',
  Chemistry: 'oklch(0.72 0.12 150)',
  Maths: 'oklch(0.74 0.14 25)',
}

function subjectTone(s: string): string {
  return SUBJECT_TONE[s] ?? 'oklch(0.74 0.13 62)'
}

function timeAgo(h: number): string {
  if (h === 0) return 'just now'
  if (h < 1) return '<1h ago'
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function DoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>(seedDoubts as Doubt[])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('recent')
  const [query, setQuery] = useState('')
  const [composing, setComposing] = useState(false)
  const [voted, setVoted] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [draft, setDraft] = useState<{ text: string; subject: string }>({
    text: '',
    subject: 'Physics',
  })
  const reduce = useReducedMotion() ?? false

  const openCount = doubts.filter((d) => !d.resolved).length
  const resolvedCount = doubts.length - openCount

  const list = useMemo(() => {
    let l = doubts
    if (filter === 'open') l = l.filter((d) => !d.resolved)
    if (filter === 'resolved') l = l.filter((d) => d.resolved)
    if (filter === 'mine') l = l.filter((d) => d.mine)
    if (query.trim()) {
      const q = query.toLowerCase()
      l = l.filter((d) => d.text.toLowerCase().includes(q))
    }
    l = [...l].sort((a, b) =>
      sort === 'recent' ? a.hoursAgo - b.hoursAgo : b.upvotes - a.upvotes
    )
    return l
  }, [doubts, filter, query, sort])

  function postDoubt() {
    if (!draft.text.trim()) return
    const newDoubt: Doubt = {
      id: `doubt-${Date.now()}`,
      text: draft.text.trim(),
      subject: draft.subject,
      asker: 'You',
      answers: 0,
      upvotes: 0,
      hoursAgo: 0,
      resolved: false,
      mine: true,
    }
    setDoubts((d) => [newDoubt, ...d])
    setDraft({ text: '', subject: 'Physics' })
    setComposing(false)
  }

  function vote(id: string) {
    const has = !!voted[id]
    setVoted((v) => ({ ...v, [id]: !has }))
    setDoubts((ds) =>
      ds.map((d) => (d.id === id ? { ...d, upvotes: d.upvotes + (has ? -1 : 1) } : d))
    )
  }

  return (
    <motion.div
      className="h-full flex flex-col gap-4"
      variants={staggerContainer(reduce)}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)}>
      <PageHeader
        title="Doubts"
        subtitle="Ask, answer, learn"
        icon={<MessageCircleQuestion className="size-4" />}
        actions={
          <PrimaryButton
            onClick={() => setComposing(true)}
            className="px-4 py-2 text-sm"
          >
            <Plus className="size-4" /> Ask a Doubt
          </PrimaryButton>
        }
      />
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="px-5 grid grid-cols-3 gap-3">
        <GlassCard className="p-3 flex items-center gap-3">
          <span className="grid place-items-center size-9 rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
            <MessageCircleQuestion className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-base font-light tabular leading-tight">{doubts.length}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-3 flex items-center gap-3">
          <span className="grid place-items-center size-9 rounded-xl bg-warning/15 text-warning border border-warning/20 shrink-0">
            <AlertCircle className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</p>
            <p className="text-base font-light tabular leading-tight">{openCount}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-3 flex items-center gap-3">
          <span className="grid place-items-center size-9 rounded-xl bg-success/15 text-success border border-success/20 shrink-0">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolved</p>
            <p className="text-base font-light tabular leading-tight">{resolvedCount}</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Search + sort */}
      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="px-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doubts..."
            aria-label="Search doubts"
            className="w-full rounded-full bg-white/5 border border-border pl-9 pr-9 py-2 text-sm outline-none focus:border-white/25 placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Segmented<SortKey>
          options={[
            { value: 'recent', label: 'Recent' },
            { value: 'top', label: 'Top voted' },
          ]}
          value={sort}
          onChange={setSort}
        />
      </motion.div>

      {/* Filter pills */}
      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="px-5 flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Pill key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Pill>
        ))}
      </motion.div>

      {/* List */}
      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="max-h-[60vh] overflow-y-auto scroll-thin px-5 pb-5">
        {list.length === 0 ? (
          <GlassCard className="p-6 min-h-[220px] flex items-center justify-center">
            <EmptyState
              icon={<MessageCircleQuestion className="size-6" />}
              title="No doubts match"
              hint="Try a different filter, or be the first to ask a question."
              cta={
                <PrimaryButton
                  onClick={() => setComposing(true)}
                  className="mt-2"
                >
                  <Plus className="size-4" /> Ask a Doubt
                </PrimaryButton>
              }
            />
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((d) => {
              const isVoted = !!voted[d.id]
              const isExpanded = !!expanded[d.id]
              const isMine = d.mine
              const tone = subjectTone(d.subject)
              return (
                <GlassCard
                  key={d.id}
                  className={cn(
                    'overflow-hidden transition-all',
                    isMine && 'ring-1 ring-primary/30'
                  )}
                >
                  <div className="p-4 flex gap-4">
                    {/* Vote */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => vote(d.id)}
                        aria-label={isVoted ? 'Remove upvote' : 'Upvote doubt'}
                        aria-pressed={isVoted}
                        className={cn(
                          'grid place-items-center size-9 rounded-lg border transition-all',
                          isVoted
                            ? 'bg-primary/15 border-primary/40 text-primary'
                            : 'bg-white/5 border-border text-muted-foreground hover:text-foreground hover:bg-white/10'
                        )}
                      >
                        <ArrowBigUp className={cn('size-5', isVoted && 'fill-current')} />
                      </button>
                      <span className="text-xs tabular font-medium">{d.upvotes}</span>
                    </div>

                    {/* Body */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: `color-mix(in oklch, ${tone} 14%, transparent)`,
                            borderColor: `color-mix(in oklch, ${tone} 28%, transparent)`,
                            color: tone,
                          }}
                        >
                          <CircleDot className="size-2.5" />
                          {d.subject}
                        </span>
                        {d.resolved ? (
                          <Badge tone="success">
                            <CheckCircle2 className="size-3" /> Resolved
                          </Badge>
                        ) : (
                          <Badge tone="warning">Open</Badge>
                        )}
                        {isMine && (
                          <Badge tone="primary">
                            <Sparkles className="size-3" /> Mine
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed text-pretty">{d.text}</p>

                      <div className="flex items-center gap-3 mt-3 flex-wrap text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Avatar name={d.asker} size={20} />
                          <span className="font-medium text-foreground/80">{d.asker}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {timeAgo(d.hoursAgo)}
                        </span>
                        <button
                          onClick={() =>
                            setExpanded((e) => ({ ...e, [d.id]: !e[d.id] }))
                          }
                          aria-expanded={isExpanded}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="size-3" />
                          {d.answers} {d.answers === 1 ? 'answer' : 'answers'}
                          <ChevronDown
                            className={cn(
                              'size-3 transition-transform',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable answers */}
                  {isExpanded && (
                    <div className="border-t border-border bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                        {d.answers > 0
                          ? `${d.answers} ${d.answers === 1 ? 'Answer' : 'Answers'}`
                          : 'No answers yet — be the first to help'}
                      </p>
                      {d.answers > 0 && (
                        <div className="flex flex-col gap-3">
                          {MOCK_ANSWERS.slice(0, Math.min(2, d.answers)).map((a, i) => (
                            <div key={i} className="flex gap-3">
                              <Avatar name={a.author} size={28} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium">{a.author}</span>
                                  <span className="text-[10px] rounded-full bg-white/5 border border-border px-1.5 py-0.5 text-muted-foreground">
                                    {a.role}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="size-2.5" /> {timeAgo(a.hoursAgo)}
                                  </span>
                                </div>
                                <p className="text-[13px] mt-1.5 leading-relaxed text-pretty">
                                  {a.text}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <ArrowBigUp className="size-3" /> {a.helpful} helpful
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Compose modal */}
      {composing && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]"
          onClick={() => setComposing(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Ask a doubt"
        >
          <GlassCard
            strong
            className="w-full max-w-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center size-8 rounded-lg bg-primary/15 text-primary border border-primary/20">
                  <MessageCircleQuestion className="size-4" />
                </span>
                <p className="text-base font-medium">Ask a Doubt</p>
              </div>
              <button
                onClick={() => setComposing(false)}
                aria-label="Close compose dialog"
                className="grid place-items-center size-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Subject
              </span>
              {SUBJECT_OPTIONS.map((s) => (
                <Pill
                  key={s}
                  active={draft.subject === s}
                  onClick={() => setDraft((d) => ({ ...d, subject: s }))}
                >
                  {s}
                </Pill>
              ))}
            </div>

            <textarea
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              autoFocus
              placeholder="Describe your doubt clearly. Mention the chapter and what you've tried…"
              aria-label="Doubt text"
              className="w-full h-32 resize-none rounded-xl bg-white/5 border border-border p-3 text-sm outline-none focus:border-white/25 scroll-thin placeholder:text-muted-foreground"
            />

            <div className="flex items-center justify-between gap-2 mt-4">
              <span className="text-[11px] text-muted-foreground">
                {draft.text.trim() ? `${draft.text.trim().length} chars` : 'Be specific and clear'}
              </span>
              <div className="flex items-center gap-2">
                <GhostButton onClick={() => setComposing(false)}>Cancel</GhostButton>
                <PrimaryButton
                  onClick={postDoubt}
                  disabled={!draft.text.trim()}
                >
                  <Send className="size-4" /> Post Doubt
                </PrimaryButton>
              </div>
            </div>
          </GlassCard>

          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}
    </motion.div>
  )
}
