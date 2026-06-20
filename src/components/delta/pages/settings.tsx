'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  User, Bell, Target, RotateCcw, Check, Trash2, Sparkles,
  Settings as SettingsIcon, Calendar, AlertTriangle, Palette, Crown,
} from 'lucide-react'
import {
  GlassCard, PageHeader, Toggle, Avatar, PrimaryButton, GhostButton, Badge,
} from '@/components/delta/ui'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem, itemTransition } from '@/lib/motion'

interface NotifState {
  live: boolean
  tests: boolean
  streak: boolean
  weekly: boolean
}

export function SettingsPage() {
  const dailyGoalHours = useStore((s) => s.dailyGoalHours)
  const setDailyGoal = useStore((s) => s.setDailyGoal)
  const customCountdownDate = useStore((s) => s.customCountdownDate)
  const countdownLabel = useStore((s) => s.countdownLabel)
  const setCountdown = useStore((s) => s.setCountdown)
  const resetWidgets = useStore((s) => s.resetWidgets)
  const setTab = useStore((s) => s.setTab)
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)

  const [notif, setNotif] = useState<NotifState>({
    live: true, tests: true, streak: true, weekly: false,
  })
  const [savedFlash, setSavedFlash] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const reduce = useReducedMotion() ?? false

  function flash() {
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1400)
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(customCountdownDate).getTime() - Date.now()) / 86400000)
  )

  function handleClearData() {
    try {
      localStorage.removeItem('project-delta-v1')
    } catch {
      /* ignore storage errors */
    }
    location.reload()
  }

  return (
    <motion.div
      className="h-full overflow-y-auto scroll-thin"
      variants={staggerContainer(reduce)}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)}>
      <PageHeader
        title="Settings"
        subtitle="Customize your experience"
        icon={<SettingsIcon className="size-4" />}
        actions={
          savedFlash ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-success animate-in fade-in duration-200">
              <Check className="size-4" /> Saved
            </span>
          ) : undefined
        }
      />
      </motion.div>

      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="px-5 pb-6 max-w-3xl mx-auto flex flex-col gap-5">
        {/* Account */}
        <SectionCard
          icon={<User className="size-4" />}
          title="Account"
          description="Update your personal information"
        >
          <div className="flex items-center gap-4 mb-5">
            <Avatar name={profile.name} size={56} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {profile.examName} · Target {profile.targetYear}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Display name"
              defaultValue={profile.name}
              onBlur={(v) => { setProfile({ name: v }); flash() }}
            />
            <Field
              label="Exam name"
              defaultValue={profile.examName}
              onBlur={(v) => { setProfile({ examName: v }); flash() }}
            />
            <Field
              label="Target year"
              defaultValue={profile.targetYear}
              onBlur={(v) => { setProfile({ targetYear: v }); flash() }}
            />
            <Field
              label="Batch"
              defaultValue={profile.batch}
              onBlur={(v) => { setProfile({ batch: v }); flash() }}
            />
            <Field
              label="Location"
              defaultValue={profile.location}
              onBlur={(v) => { setProfile({ location: v }); flash() }}
              className="sm:col-span-2"
            />
            <Field
              label="Bio"
              textarea
              defaultValue={profile.bio}
              onBlur={(v) => { setProfile({ bio: v }); flash() }}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex justify-end mt-4">
            <PrimaryButton onClick={flash}>
              <Check className="size-3.5" /> Save changes
            </PrimaryButton>
          </div>
        </SectionCard>

        {/* Study Goals */}
        <SectionCard
          icon={<Target className="size-4" />}
          title="Study Goals"
          description="Set your daily study target"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="daily-goal" className="text-sm">
                Daily study goal
              </label>
              <span className="text-sm tabular text-primary font-medium">
                {dailyGoalHours}h / day
              </span>
            </div>
            <input
              id="daily-goal"
              type="range"
              min={1}
              max={12}
              step={1}
              value={dailyGoalHours}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              onPointerUp={flash}
              className="w-full accent-primary cursor-pointer"
              aria-describedby="daily-goal-hint"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground tabular">
              <span>1h</span>
              <span>6h</span>
              <span>12h</span>
            </div>
            <p id="daily-goal-hint" className="text-[11px] text-muted-foreground">
              Powers your daily progress ring on the dashboard.
            </p>
          </div>
        </SectionCard>

        {/* Countdown */}
        <SectionCard
          icon={<Calendar className="size-4" />}
          title="Countdown"
          description="Track your most important date"
        >
          <div className="space-y-3">
            <Field
              label="Countdown label"
              defaultValue={countdownLabel}
              hint="Shown on the countdown widget (e.g. Exam Day, Final Test)"
              onBlur={(v) => { setCountdown(v || 'Exam Day', customCountdownDate); flash() }}
            />
            <div>
              <span className="text-[11px] text-muted-foreground">Target date</span>
              <input
                type="date"
                defaultValue={customCountdownDate}
                onChange={(e) => { setCountdown(countdownLabel, e.target.value); flash() }}
                className="mt-1 w-full sm:w-auto rounded-lg bg-white/5 border border-border px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-primary/[0.06] border border-primary/15 p-3">
              <span className="grid place-items-center size-10 rounded-lg bg-primary/15 text-primary border border-primary/20 shrink-0">
                <Calendar className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {countdownLabel || 'Exam Day'}
                </p>
                <p className="text-lg font-light tabular">
                  <span className="text-primary font-medium">{daysRemaining}</span>
                  <span className="text-muted-foreground text-sm ml-1.5">days remaining</span>
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={<Bell className="size-4" />}
          title="Notifications"
          description="Choose what to be reminded about"
        >
          <div className="divide-y divide-border/70">
            <NotifRow
              label="Live class reminders"
              hint="A nudge 10 minutes before a live class starts"
              checked={notif.live}
              onChange={(v) => { setNotif((n) => ({ ...n, live: v })); flash() }}
            />
            <NotifRow
              label="Test deadlines"
              hint="A reminder 24 hours before any test expires"
              checked={notif.tests}
              onChange={(v) => { setNotif((n) => ({ ...n, tests: v })); flash() }}
            />
            <NotifRow
              label="Streak alerts"
              hint="Don't break the chain — a daily study reminder"
              checked={notif.streak}
              onChange={(v) => { setNotif((n) => ({ ...n, streak: v })); flash() }}
            />
            <NotifRow
              label="Weekly progress"
              hint="A Sunday digest of your week"
              checked={notif.weekly}
              onChange={(v) => { setNotif((n) => ({ ...n, weekly: v })); flash() }}
            />
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard
          icon={<Palette className="size-4" />}
          title="Appearance"
          description="Theme and dashboard preferences"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-border p-3">
              <span className="grid place-items-center size-10 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 shrink-0">
                <Crown className="size-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Warm Obsidian (Dark)</p>
                <p className="text-[11px] text-muted-foreground text-pretty">
                  The signature Delta theme — amber accents on a warm dark canvas.
                  Light mode is on the roadmap.
                </p>
              </div>
              <Badge tone="primary">Active</Badge>
            </div>
            <Row
              label="Customize dashboard"
              hint="Add widgets, drag, resize & arrange your home"
            >
              <GhostButton onClick={() => setTab('playground')}>
                <Sparkles className="size-3.5" /> Open Playground
              </GhostButton>
            </Row>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard
          danger
          icon={<AlertTriangle className="size-4" />}
          title="Danger Zone"
          description="Irreversible actions — proceed with care"
        >
          <div className="space-y-3">
            <Row
              label="Reset widget layout"
              hint="Restore the default home dashboard arrangement"
              dangerAction
            >
              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <GhostButton onClick={() => setConfirmReset(false)}>Cancel</GhostButton>
                  <button
                    onClick={() => { resetWidgets(); setConfirmReset(false); flash() }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 text-warning border border-warning/30 px-4 py-2 text-xs font-medium hover:bg-warning/25 transition-colors"
                  >
                    <RotateCcw className="size-3.5" /> Yes, reset
                  </button>
                </div>
              ) : (
                <GhostButton onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="size-3.5" /> Reset
                </GhostButton>
              )}
            </Row>

            <Row
              label="Clear all local data"
              hint="Resets progress, notes, history and widgets on this device"
              dangerAction
            >
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <GhostButton onClick={() => setConfirmClear(false)}>Cancel</GhostButton>
                  <button
                    onClick={handleClearData}
                    className="inline-flex items-center gap-1.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30 px-4 py-2 text-xs font-medium hover:bg-destructive/30 transition-colors"
                  >
                    <Trash2 className="size-3.5" /> Yes, clear everything
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-4 py-2 text-xs font-medium hover:bg-destructive/25 transition-colors"
                >
                  <Trash2 className="size-3.5" /> Clear data
                </button>
              )}
            </Row>
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionCard({
  icon, title, description, children, danger,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <GlassCard className={cn('p-5', danger && 'border-destructive/25')}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <span
          className={cn(
            'grid place-items-center size-8 rounded-lg border shrink-0',
            danger
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-primary/10 text-primary border-primary/15'
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-[11px] text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      {children}
    </GlassCard>
  )
}

function Row({
  label, hint, children, dangerAction,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  dangerAction?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className={cn('text-sm', dangerAction && 'text-destructive')}>{label}</p>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-0.5 text-pretty">{hint}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function NotifRow({
  label, hint, checked, onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {hint && (
          <p className="text-[11px] text-muted-foreground mt-0.5 text-pretty">{hint}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

function Field({
  label, defaultValue, onBlur, textarea, hint, className,
}: {
  label: string
  defaultValue: string
  onBlur?: (value: string) => void
  textarea?: boolean
  hint?: string
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          defaultValue={defaultValue}
          onBlur={(e) => onBlur?.(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-none rounded-lg bg-white/5 border border-border px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors scroll-thin"
        />
      ) : (
        <input
          defaultValue={defaultValue}
          onBlur={(e) => onBlur?.(e.target.value)}
          className="mt-1 w-full rounded-lg bg-white/5 border border-border px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
        />
      )}
      {hint && (
        <span className="text-[10px] text-muted-foreground/70 mt-1 block">{hint}</span>
      )}
    </label>
  )
}
