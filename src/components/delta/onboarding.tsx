'use client'

import { useStore } from '@/lib/store'
import { useState } from 'react'
import { GraduationCap, Check, Target, Sparkles, UserRound, MapPin, BookOpenCheck, ArrowRight, ChevronLeft, Plus, X, Briefcase, Rocket, Palette, Code2, Database, TrendingUp, Heart, Languages, Music, PenLine, FlaskConical, Atom, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const TARGET_YEARS = ['2026', '2027', '2028']

/**
 * Track presets — span students, professionals, and personal growth so the
 * app serves anyone, not just science-exam aspirants. Each preset pre-fills a
 * relevant subject set; "Custom" lets the user pick freely (incl. adding their
 * own subject names via the free-form input in step 3).
 */
interface TrackPreset {
  id: string
  name: string
  blurb: string
  icon: typeof Code2
  subjects: string[]
}

interface TrackCategory {
  label: string
  presets: TrackPreset[]
}

const TRACK_CATEGORIES: TrackCategory[] = [
  {
    label: 'Students & Academics',
    presets: [
      { id: 'jee', name: 'JEE / Engineering', blurb: 'Physics · Chemistry · Maths', icon: Atom, subjects: ['Physics', 'Chemistry', 'Maths'] },
      { id: 'neet', name: 'NEET / Medical', blurb: 'Physics · Chemistry · Biology', icon: Heart, subjects: ['Physics', 'Chemistry', 'Biology'] },
      { id: 'boards', name: 'Board Exams', blurb: 'Core science + English', icon: GraduationCap, subjects: ['Physics', 'Chemistry', 'Maths', 'Biology', 'English'] },
      { id: 'upsc', name: 'UPSC / Civil Services', blurb: 'Polity · History · Geography', icon: Trophy, subjects: ['Polity', 'History', 'Geography', 'Economy', 'Current Affairs'] },
      { id: 'gate', name: 'GATE / Higher Studies', blurb: 'CS · Maths', icon: FlaskConical, subjects: ['Computer Science', 'Maths'] },
      { id: 'language', name: 'Language / Aptitude', blurb: 'English & verbal skills', icon: Languages, subjects: ['English', 'Verbal Ability'] },
    ],
  },
  {
    label: 'Professionals',
    presets: [
      { id: 'dev', name: 'Software Developer', blurb: 'DSA · System Design · DB', icon: Code2, subjects: ['Data Structures', 'Algorithms', 'System Design', 'Databases'] },
      { id: 'data', name: 'Data / ML Engineer', blurb: 'Stats · Python · ML · DL', icon: Database, subjects: ['Statistics', 'Python', 'Machine Learning', 'Deep Learning'] },
      { id: 'pm', name: 'Product Manager', blurb: 'Strategy · Analytics · UX', icon: Briefcase, subjects: ['Product Strategy', 'Analytics', 'User Research', 'Roadmapping'] },
      { id: 'design', name: 'Designer', blurb: 'UI/UX · Type · Color · Motion', icon: Palette, subjects: ['UI/UX', 'Typography', 'Color Theory', 'Motion Design'] },
      { id: 'finance', name: 'Business / Finance', blurb: 'Accounting · Markets · Excel', icon: TrendingUp, subjects: ['Accounting', 'Markets', 'Excel', 'Strategy'] },
      { id: 'marketing', name: 'Marketing / Growth', blurb: 'SEO · Content · Ads', icon: Rocket, subjects: ['SEO', 'Content', 'Analytics', 'Paid Media'] },
      { id: 'devops', name: 'DevOps / Cloud', blurb: 'Linux · AWS · K8s · CI/CD', icon: Code2, subjects: ['Linux', 'AWS', 'Kubernetes', 'CI/CD'] },
    ],
  },
  {
    label: 'Personal Growth',
    presets: [
      { id: 'lang-learn', name: 'Language Learning', blurb: 'Vocab · Grammar · Speaking', icon: Languages, subjects: ['Vocabulary', 'Grammar', 'Speaking', 'Listening'] },
      { id: 'fitness', name: 'Fitness & Health', blurb: 'Nutrition · Training · Recovery', icon: Heart, subjects: ['Nutrition', 'Training', 'Recovery', 'Mindfulness'] },
      { id: 'writing', name: 'Creative Writing', blurb: 'Plot · Character · Prose', icon: PenLine, subjects: ['Plot', 'Character', 'Prose', 'Poetry'] },
      { id: 'music', name: 'Music', blurb: 'Theory · Practice · Composition', icon: Music, subjects: ['Theory', 'Practice', 'Composition', 'Ear Training'] },
      { id: 'gk', name: 'General Knowledge', blurb: 'History · Science · Current', icon: BookOpenCheck, subjects: ['History', 'Science', 'Current Affairs'] },
    ],
  },
  {
    label: '',
    presets: [
      { id: 'custom', name: 'Custom', blurb: 'Pick your own subjects', icon: Plus, subjects: [] },
    ],
  },
]

const ALL_PRESETS = TRACK_CATEGORIES.flatMap((c) => c.presets)

export function Onboarding() {
  const { onboardingDone, finishOnboarding, setDailyGoal, setProfile } = useStore()
  const [step, setStep] = useState(0)
  const [presetId, setPresetId] = useState<string>('')
  const [picked, setPicked] = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState('')
  const [goal, setGoal] = useState(6)

  // profile fields
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [examName, setExamName] = useState('')
  const [targetYear, setTargetYear] = useState('2027')
  const [bio, setBio] = useState('')

  if (onboardingDone) return null

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'

  const steps = [
    {
      icon: <Sparkles className="size-6" />,
      title: 'Welcome to Project Delta',
      body: 'Your premium command center for learning — lectures, tests, analytics and a fully configurable dashboard. For students, professionals, and anyone building a skill.',
    },
    {
      icon: <UserRound className="size-6" />,
      title: 'Create your profile',
      body: 'Tell us who you are and what you are working toward. This personalizes your dashboard, profile page and greetings.',
    },
    {
      icon: <BookOpenCheck className="size-6" />,
      title: 'What are you here for?',
      body: 'Pick a track to pre-fill the right subjects. Students, professionals, creators — there is a preset for everyone. You can change everything later.',
    },
    {
      icon: <GraduationCap className="size-6" />,
      title: 'Confirm your subjects',
      body: 'These power your library, tests and doubts. Add your own if a subject is missing — you can change this anytime in Settings.',
    },
    {
      icon: <Target className="size-6" />,
      title: 'Set a daily goal',
      body: 'How many hours do you aim to put in each day? This powers your goal ring and streak.',
    },
  ]
  const last = steps.length - 1
  const s = steps[step]

  function choosePreset(p: TrackPreset) {
    setPresetId(p.id)
    setPicked(p.subjects)
    if (!examName.trim()) setExamName(p.name)
  }

  function addCustomSubject() {
    const v = customSubject.trim()
    if (!v || picked.includes(v)) return
    setPicked((p) => [...p, v])
    setCustomSubject('')
  }

  const canContinue =
    step === 1 ? name.trim().length > 0 :
    step === 2 ? presetId !== '' :
    step === 3 ? picked.length > 0 :
    true

  const continueLabel =
    step === 1 ? 'Looks good' :
    step === 2 ? 'Use these subjects' :
    step === 3 ? 'Almost done' :
    step === last ? 'Enter Delta' : 'Continue'

  function commit() {
    const resolvedGoal = examName.trim() || 'My Goal'
    const preset = ALL_PRESETS.find((p) => p.id === presetId)
    const track = preset?.name ?? 'Learner'
    setProfile({
      name: name.trim() || 'New Learner',
      location: location.trim() || 'Not set',
      targetYear,
      batch: `${resolvedGoal} ${targetYear}`,
      examName: resolvedGoal,
      track,
      subjects: picked,
      bio: bio.trim() || `${track} working toward ${resolvedGoal} on Project Delta.`,
    })
    setDailyGoal(goal)
    finishOnboarding()
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/65 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease]">
      <div className="w-[min(560px,92vw)] glass-strong rounded-3xl elev-3 p-6 sm:p-7 relative animate-[popIn_0.25s_ease] max-h-[92vh] overflow-y-auto scroll-thin">
        {/* Step icon + title */}
        <div className="flex items-start gap-4">
          <div className="grid place-items-center size-12 rounded-2xl bg-primary text-primary-foreground shrink-0 elev-1">
            {s.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <span>Step {step + 1} of {steps.length}</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-balance mt-0.5">{s.title}</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed text-pretty">{s.body}</p>
          </div>
        </div>

        {/* Step 1 — create profile */}
        {step === 1 && (
          <div className="mt-5 flex flex-col gap-3 animate-[fadeUp_0.25s_ease]">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center size-16 rounded-2xl bg-primary/15 text-primary text-xl font-medium shrink-0 border border-primary/20">
                {initials}
              </div>
              <div className="flex-1">
                <Field label="Full name" required>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Riya Verma"
                    className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
                  />
                </Field>
              </div>
            </div>

            <Field label="Goal / focus name" icon={<BookOpenCheck className="size-3.5" />}>
              <input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Frontend Dev, JEE, UPSC, IELTS, Guitar…"
                className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
              />
            </Field>

            <Field label="Location (optional)" icon={<MapPin className="size-3.5" />}>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, India"
                className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
              />
            </Field>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Target year</p>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_YEARS.map((y) => {
                  const on = targetYear === y
                  return (
                    <button
                      key={y}
                      onClick={() => setTargetYear(y)}
                      className={cn(
                        'rounded-xl border py-2 text-sm font-medium transition-all',
                        on ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                      )}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            </div>

            <Field label="Short bio (optional)">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="A line about your goals…"
                className="w-full bg-transparent outline-none text-sm resize-none placeholder:text-muted-foreground/60"
              />
            </Field>
          </div>
        )}

        {/* Step 2 — choose track preset */}
        {step === 2 && (
          <div className="mt-5 flex flex-col gap-4 animate-[fadeUp_0.25s_ease]">
            {TRACK_CATEGORIES.map((cat) => cat.label ? (
              <div key={cat.label}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{cat.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {cat.presets.map((p) => {
                    const on = presetId === p.id
                    const Icon = p.icon
                    return (
                      <button
                        key={p.id}
                        onClick={() => choosePreset(p)}
                        className={cn(
                          'rounded-xl border p-3 text-left transition-all',
                          on ? 'border-primary bg-primary/10' : 'border-border bg-white/5 hover:bg-white/10 hover:border-white/15'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[13px] font-medium">
                            <Icon className="size-3.5 text-primary" />
                            {p.name}
                          </span>
                          {on && <Check className="size-3.5 text-primary" />}
                        </div>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{p.blurb}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div key="custom-row">
                <div className="grid grid-cols-2 gap-2">
                  {cat.presets.map((p) => {
                    const on = presetId === p.id
                    const Icon = p.icon
                    return (
                      <button
                        key={p.id}
                        onClick={() => choosePreset(p)}
                        className={cn(
                          'rounded-xl border p-3 text-left transition-all col-span-2',
                          on ? 'border-primary bg-primary/10' : 'border-border bg-white/5 hover:bg-white/10 hover:border-white/15'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[13px] font-medium">
                            <Icon className="size-3.5 text-primary" />
                            {p.name}
                          </span>
                          {on && <Check className="size-3.5 text-primary" />}
                        </div>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{p.blurb}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 — subjects (free-form, preset-seeded) */}
        {step === 3 && (
          <div className="mt-5 animate-[fadeUp_0.25s_ease]">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Your subjects</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {picked.length === 0 && (
                <span className="text-xs text-muted-foreground">No subjects yet — add some below.</span>
              )}
              {picked.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  {sub}
                  <button
                    onClick={() => setPicked((p) => p.filter((x) => x !== sub))}
                    aria-label={`Remove ${sub}`}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            {/* Add custom subject */}
            <div className="flex gap-2">
              <input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject() } }}
                placeholder="Add a subject and press Enter…"
                className="flex-1 rounded-xl border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/60"
              />
              <button
                onClick={addCustomSubject}
                disabled={!customSubject.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-primary/15 border border-primary/25 text-primary px-3 py-2 text-xs font-medium hover:bg-primary/25 transition-colors disabled:opacity-40"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 text-pretty">
              These appear in your Library, Tests, and Doubts. Add anything — a language, a framework, a hobby.
            </p>
          </div>
        )}

        {/* Step 4 — daily goal */}
        {step === 4 && (
          <div className="mt-6 animate-[fadeUp_0.25s_ease]">
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm text-muted-foreground">Daily goal</span>
              <span className="text-4xl font-light tabular">{goal}<span className="text-sm text-muted-foreground ml-1">hrs</span></span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full accent-[oklch(0.74_0.135_62)]"
              aria-label="Daily goal in hours"
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/70 tabular">
              <span>1h</span><span>6h</span><span>12h</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-pretty">
              You can fine-tune this anytime from Settings. Your streak rewards consistency, not intensity.
            </p>
          </div>
        )}

        {/* Footer — progress + actions */}
        <div className="flex items-center justify-between mt-7 gap-3">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="grid place-items-center size-8 rounded-full bg-white/5 border border-border text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                aria-label="Previous step"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-white/15')}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={commit} className="rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip
            </button>
            <button
              disabled={!canContinue}
              onClick={() => {
                if (step < last) setStep(step + 1)
                else commit()
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-medium bg-primary text-primary-foreground hover:brightness-110 active:translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {continueLabel}
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes popIn{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}

function Field({ label, icon, required, children }: { label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-border bg-white/5 px-3 py-2 focus-within:border-primary/60 focus-within:bg-white/[0.07] transition-colors">
      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {icon}
        {label}
        {required && <span className="text-primary">*</span>}
      </span>
      {children}
    </label>
  )
}
