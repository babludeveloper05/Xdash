'use client'

import { useStore } from '@/lib/store'
import { SUBJECTS, type SubjectId } from '@/lib/mock-data'
import { useState } from 'react'
import { GraduationCap, Check, Target, Sparkles, UserRound, MapPin, BookOpenCheck, ArrowRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const TARGET_YEARS = ['2026', '2027', '2028']

// Exam presets pre-select relevant subjects. "Custom" lets the user pick freely.
interface ExamPreset {
  id: string
  name: string
  blurb: string
  subjects: SubjectId[]
}

const EXAM_PRESETS: ExamPreset[] = [
  { id: 'jee', name: 'JEE (Engineering)', blurb: 'Physics · Chemistry · Maths', subjects: ['physics', 'chemistry', 'maths'] },
  { id: 'neet', name: 'NEET (Medical)', blurb: 'Physics · Chemistry · Biology', subjects: ['physics', 'chemistry', 'biology'] },
  { id: 'boards', name: 'Board Exams', blurb: 'Core science + English', subjects: ['physics', 'chemistry', 'maths', 'biology', 'english'] },
  { id: 'gate-cs', name: 'GATE / CS', blurb: 'Computer Science · Maths', subjects: ['cs', 'maths'] },
  { id: 'language', name: 'Language / Aptitude', blurb: 'English & verbal skills', subjects: ['english'] },
  { id: 'custom', name: 'Custom', blurb: 'Pick your own subjects', subjects: [] },
]

export function Onboarding() {
  const { onboardingDone, finishOnboarding, setDailyGoal, setProfile } = useStore()
  const [step, setStep] = useState(0)
  const [examPresetId, setExamPresetId] = useState<string>('')
  const [picked, setPicked] = useState<SubjectId[]>([])
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
      body: 'Your premium command center for exam preparation — lectures, tests, analytics and a fully configurable dashboard, whatever you are studying for.',
    },
    {
      icon: <UserRound className="size-6" />,
      title: 'Create your profile',
      body: 'Tell us who you are and what you are preparing for. This personalizes your dashboard, profile page and greetings.',
    },
    {
      icon: <BookOpenCheck className="size-6" />,
      title: 'Choose your exam',
      body: 'Pick a preset to pre-fill the right subjects, or go fully custom. You can change everything later in Settings.',
    },
    {
      icon: <GraduationCap className="size-6" />,
      title: 'Select your subjects',
      body: 'Confirm the subjects you want to focus on. You can change this anytime in Settings.',
    },
    {
      icon: <Target className="size-6" />,
      title: 'Set a daily study goal',
      body: 'How many hours do you aim to study each day? This powers your goal ring and streak.',
    },
  ]
  const last = steps.length - 1
  const s = steps[step]

  function choosePreset(p: ExamPreset) {
    setExamPresetId(p.id)
    if (p.id !== 'custom') {
      setPicked(p.subjects)
      if (!examName.trim()) setExamName(p.name)
    }
  }

  const canContinue =
    step === 1 ? name.trim().length > 0 :
    step === 2 ? examPresetId !== '' :
    step === 3 ? picked.length > 0 :
    true

  const continueLabel =
    step === 1 ? 'Looks good' :
    step === 2 ? 'Use these subjects' :
    step === 3 ? 'Almost done' :
    step === last ? 'Enter Delta' : 'Continue'

  function commit() {
    const resolvedExam = examName.trim() || 'My Exam'
    setProfile({
      name: name.trim() || 'Aryan Sharma',
      location: location.trim() || 'Not set',
      targetYear,
      batch: `${resolvedExam} ${targetYear}`,
      examName: resolvedExam,
      bio: bio.trim() || `Preparing for ${resolvedExam} ${targetYear} on Project Delta.`,
    })
    setDailyGoal(goal)
    finishOnboarding()
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/65 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease]">
      <div className="w-[min(540px,92vw)] glass-strong rounded-3xl elev-3 p-6 sm:p-7 relative animate-[popIn_0.25s_ease]">
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
                    placeholder="e.g. Aryan Sharma"
                    className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
                  />
                </Field>
              </div>
            </div>

            <Field label="Exam / goal name" icon={<BookOpenCheck className="size-3.5" />}>
              <input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. JEE, NEET, UPSC, CAT, GATE…"
                className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
              />
            </Field>

            <Field label="Location (optional)" icon={<MapPin className="size-3.5" />}>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kota, Rajasthan"
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

        {/* Step 2 — choose exam preset */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-2 mt-5 animate-[fadeUp_0.25s_ease]">
            {EXAM_PRESETS.map((p) => {
              const on = examPresetId === p.id
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
                    <span className="text-[13px] font-medium">{p.name}</span>
                    {on && <Check className="size-3.5 text-primary" />}
                  </div>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{p.blurb}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Step 3 — subjects */}
        {step === 3 && (
          <div className="grid grid-cols-3 gap-2 mt-5 animate-[fadeUp_0.25s_ease]">
            {SUBJECTS.map((sub) => {
              const on = picked.includes(sub.id)
              return (
                <button
                  key={sub.id}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== sub.id) : [...p, sub.id]))}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    on ? 'border-primary bg-primary/10' : 'border-border bg-white/5 hover:bg-white/10 hover:border-white/15'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{sub.name}</span>
                    {on && <Check className="size-3.5 text-primary" />}
                  </div>
                  <span className="block text-[10px] text-muted-foreground/70 mt-0.5">{sub.icon}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Step 4 — daily goal */}
        {step === 4 && (
          <div className="mt-6 animate-[fadeUp_0.25s_ease]">
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm text-muted-foreground">Daily study goal</span>
              <span className="text-4xl font-light tabular">{goal}<span className="text-sm text-muted-foreground ml-1">hrs</span></span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full accent-[oklch(0.74_0.135_62)]"
              aria-label="Daily study goal in hours"
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
