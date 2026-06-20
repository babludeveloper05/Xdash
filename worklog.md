---
Task ID: analysis-shell
Agent: Explore (shell-components analyzer)
Task: Analyze the Delta shell, player, spotlight, onboarding, ui helpers in /home/z/my-project/analysis

Work Log:
- Read `/home/z/my-project/worklog.md` (did not exist; this file is being created).
- Read all 12 target files in full:
  - `src/components/delta/app-shell.tsx` (95 lines)
  - `src/components/delta/top-nav.tsx` (95 lines)
  - `src/components/delta/spotlight.tsx` (192 lines)
  - `src/components/delta/onboarding.tsx` (334 lines)
  - `src/components/delta/video-player.tsx` (720 lines)
  - `src/components/delta/ui.tsx` (456 lines)
  - `src/lib/mock-data.ts` (429 lines)
  - `src/lib/store.ts` (352 lines)
  - `src/lib/utils.ts` (6 lines)
  - `src/app/api/route.ts` (5 lines)
  - `src/hooks/use-mobile.ts` (19 lines)
  - `src/hooks/use-toast.ts` (194 lines)
- Cross-checked supporting files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`, `package.json`, and the `pages/` directory.
- Grepped for usage of every exported store method, selector hook, custom hook, and icon import to identify dead code and over-subscription patterns.
- Verified the byte-level contents of the "known broken line" in `app-shell.tsx` (see Stage Summary).
- Compiled per-file findings plus cross-cutting summaries (mock-data model, store shape, ui primitives, video architecture, spotlight, onboarding).

Stage Summary:

## 1. Per-file analysis

### `src/components/delta/app-shell.tsx` (95 lines)

**Purpose / responsibility.** Top-level client shell that mounts the persistent chrome (`TopNav`, `Spotlight`, `Onboarding`, `VideoLayer`) and renders the currently active page inside `<main>`.

**Public exports.**
- `AppShell()` — default export of the root page (`src/app/page.tsx`).
- Internal `ActivePage()` switch component (not exported).

**Notable patterns.**
- `useStore()` is destructured for `cycleTab`, `activeTab`, `spotlightOpen`, `theaterVideoId` — **over-subscription**: any state change re-renders the shell (including the 250ms-tick `videoProgress` updates fired during playback).
- A `mounted` flag (`useState(false)` flipped in a `useEffect`) gates the real UI behind a branded loading screen (`<Triangle>` + three bouncing dots) to avoid hydration flashes from the persisted Zustand store.
- Global `keydown` listener for `ArrowLeft`/`ArrowRight` to cycle tabs — correctly bails when typing in inputs/textareas/contenteditable, when the spotlight is open, or when a theater video is open (so the player's own arrows can take over).
- `<main key={activeTab} className="… animate-[fadeUp_0.28s_ease]">` — the `key` forces a full remount on every tab change. Re-triggers the entrance animation but discards scroll position and any in-page local state.
- A `<style>` block injects the `fadeUp` keyframe globally. Other shell files do the same (`spotlight`, `onboarding`, `video-player`) — duplicated keyframes across files; should live in `globals.css`.

**Known broken line — CONFIRMED FIXED.**
The task mentioned a broken line `const ounted, setMounted] = useState(false)` in `app-shell.tsx`. The current file at line 46 reads (verified with `od -c`):
```ts
const [mounted, setMounted] = useState(false)
```
i.e. it is **already correct**. No malformed destructuring present in this file.

**Interactions.** Imports every page in `./pages/*` (home, library, tests, notes, live, analytics, leaderboard, achievements, profile, settings, syllabus, doubts, playground). Imports `TopNav`, `Spotlight`, `Onboarding`, `VideoLayer` from sibling files. Uses `useStore` and `Triangle` from lucide-react.

**Accessibility.** Loading screen icon is purely decorative (no `aria-hidden`, minor). `<main>` has no `aria-label`/`role` (defaults to implicit main landmark). The cycle-tab shortcut has no visual affordance — discoverable only by accident.

**Mobile / responsive.** Header is `h-16` (64px). `<main>` is positioned `top-16 bottom-0 inset-x-0` — assumes a fixed 64px header height (hard-coded coupling with `top-nav.tsx`).

**Performance.** Over-subscription via `useStore()` (no selector) is the main concern — re-renders on every 250ms progress tick during video playback.

---

### `src/components/delta/top-nav.tsx` (95 lines)

**Purpose.** Fixed top header: logo, center pill-style tab switcher, right cluster (search button, notifications bell, profile avatar).

**Public exports.** `TopNav()`.

**Notable patterns.**
- Local `TABS` constant of 10 entries — **does NOT include `syllabus`, `doubts`, `playground`** even though those are valid `TabId` values and have working pages. They can only be reached via Spotlight (which also omits `playground`) or buttons inside other pages (Home/Settings link to Playground).
- `useStore()` destructured for `activeTab, setTab, setSpotlight` — same over-subscription pattern as `AppShell`.
- Separate selectors for `profileName = useStore((s) => s.profile.name)` — **good pattern**, but used inconsistently alongside the destructured full-store call.
- Logo button has `aria-label="Project Delta — Home"` and `aria-current={on ? 'page' : undefined}` on active tabs — good.

**Code-quality issues.**
- **Duplicate `rounded-full` class** on the profile button (line 89):
  ```tsx
  <button … className="rounded-full ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring rounded-full">
  ```
  `rounded-full` appears twice. `ring-offset-2` is always applied (harmless, but should be `focus-visible:ring-offset-2` if intended only on focus).
- Notifications `IconButton` has an unread dot `<span>` with no text / `aria-label` — screen readers won't announce unread status.
- The center nav uses `overflow-x-auto scroll-none` so tabs scroll horizontally on small screens, but with 10 entries the right edge can be hard to discover on mobile.

**Accessibility.** Mostly good (aria-labels everywhere, `aria-current="page"` on the active tab). Profile button is a `<button>` wrapping an `Avatar` with `aria-hidden`, so the only accessible name is `aria-label="Open profile"`.

**Mobile / responsive.** Logo wordmark hidden below `sm`. Desktop search bar (`hidden md:flex … ⌘K`) is replaced with an icon-only button on mobile (`md:hidden`). Right cluster uses `gap-1.5 sm:gap-2`.

**Performance.** Over-subscription via `useStore()` — re-renders on every state change including 250ms playback ticks.

---

### `src/components/delta/spotlight.tsx` (192 lines)

**Purpose.** Cmd-K command palette. Searches across pages, videos, tests, notes. Keyboard-navigable.

**Public exports.** `Spotlight()`.

**Notable patterns.**
- `useStore()` destructured for `spotlightOpen, setSpotlight, setTab, openTheater, notes`.
- `useMemo` builds the result list — depends on `[q, notes]`. When `q` is empty, returns the first 6 page entries; otherwise merges filtered pages + up to 5 videos + 4 tests + 3 notes (≤12 total).
- Global `keydown` listener toggles with `⌘/Ctrl+K`, navigates with `↑/↓`, opens with `Enter`, closes with `Esc`.
- `choose(r)` switches tab and, for video results, opens the theater via `if (r.tab === 'library' && r.id.includes('-v')) openTheater(r.id)`.
- Results are grouped consecutively by `group` label using a `forEach` that mutates a local `grouped` array.
- A `runningIndex` counter is mutated inside `.map()` callbacks to track the global index of each rendered result.

**Code-quality issues.**
- **`r.id.includes('-v')` is fragile.** Video IDs are shaped `physics-c1-v1` (contain `-v`), but the check would also match any future test/note ID that happens to contain `-v` (e.g. `test-v1`). Better to discriminate by `r.group === 'Videos'` or add a `kind` field to `Result`.
- **`let runningIndex = 0` mutated inside JSX map** — side-effect in render. Works because JSX is evaluated sequentially, but it's not idiomatic React; compute indices up front instead.
- The pages list has 12 of the 13 `TabId` values — **`playground` is omitted**, so users can search but never reach Playground from the palette.
- `useEffect` for keyboard has `[spotlightOpen, results, sel]` deps but the `⌘K` toggle inside the same handler reads `spotlightOpen` from closure — could miss the latest toggle if `results`/`sel` change rapidly. Functional but easy to get wrong.

**Accessibility.**
- `autoFocus` on the input — good.
- Backdrop click + `Esc` close — good.
- The dialog container is a `<div>` with no `role="dialog"` / `aria-modal="true"` — should be `role="dialog" aria-modal="true" aria-label="Search"`.
- No focus trap: Tab can move focus behind the overlay.
- Result buttons have hover-to-select (`onMouseEnter`) but no `onFocus` to keep `sel` in sync when tabbing through results.

**Mobile / responsive.** Width `w-[min(640px,92vw)]`, max-height `56vh` for the list. `pt-[10vh]` from the top — reasonable.

**Performance.** `useMemo` on results is fine. Over-subscription via `useStore()`.

---

### `src/components/delta/onboarding.tsx` (334 lines)

**Purpose.** Five-step welcome wizard: welcome → profile → exam preset → subjects → daily-goal slider. Persists results via `setProfile` + `setDailyGoal` + `finishOnboarding`.

**Public exports.** `Onboarding()` (and the internal `Field` helper, not exported).

**Notable patterns.**
- Local `EXAM_PRESETS` (JEE / NEET / Boards / GATE-CS / Language / Custom) — picking a non-custom preset pre-fills `picked` subjects and (if blank) the exam name.
- `canContinue` gating per step (name required, preset required, ≥1 subject required, last step always OK).
- `commit()` fills the profile with sensible fallbacks (`name || 'Aryan Sharma'`, `examName || 'My Exam'`, etc.) and finishes onboarding.
- Two `useState`-driven animation keyframes (`fadeIn`, `popIn`, `fadeUp`) injected via a `<style>` block.
- `initials` derived from `name` (first two words) with `|| '?'` fallback.
- `TARGET_YEARS = ['2026', '2027', '2028']`.

**Code-quality issues.**
- **"Skip" button calls `commit()` directly** (line 301):
  ```tsx
  <button onClick={commit} className="…">Skip</button>
  ```
  This is the same handler as the final "Enter Delta" button. Skip ≠ Skip — it commits whatever is currently filled, using the fallback defaults if blanks. At step 0, "Skip" silently creates a profile named "Aryan Sharma" with exam "My Exam" — surprising UX. Either implement true skip (set `onboardingDone: true` without writing profile) or rename the button.
- **No `Escape` key handler.** User must use Continue/Skip to dismiss.
- **No `role="dialog"` / `aria-modal="true"`** on the overlay; no focus trap.
- `autoFocus` only on step 1's name input — focus is not moved when steps change.
- Progress dots at the footer have no `aria-label` (just visual dots).
- Step 3 (subjects) uses `grid-cols-3` — on small phones the 6 subjects fit, but labels like "Computer Science" will wrap aggressively.

**Accessibility.** Each `Field` wraps input in `<label>` (good). Required fields marked with `*` (visible, not conveyed via `aria-required`). Range input has `aria-label="Daily study goal in hours"` (good). Target-year buttons are real `<button>`s. Exam/subject tiles are real `<button>`s with `Check` icon when selected (visual only — no `aria-pressed`).

**Mobile / responsive.** Width `w-[min(540px,92vw)]`, padding `p-6 sm:p-7`. Two-column grid for exam presets. Three-column grids for subjects and target years.

**Performance.** Over-subscription via `useStore()`. Component returns `null` early when `onboardingDone`, so post-onboarding cost is just the initial render check.

---

### `src/components/delta/video-player.tsx` (720 lines)

**Purpose.** Theater modal + PiP widget. Implements a fake playback engine that advances `videoProgress` in the store on a 250ms interval.

**Public exports.**
- `VideoLayer()` — top-level component rendered by `AppShell`.
- `getVideo(id: string)` — re-exported helper used elsewhere (e.g. library page).

**Internal helpers (not exported).**
- `usePlayback(videoId)` — playback hook: returns `{ playing, setPlaying, speed, setSpeed, fraction, video }`.
- `Seekbar` — slider with hover preview, chapter markers at 0.25/0.5/0.75, hover tooltip.
- `CtrlButton` — round 36px control button with aria-label + title.
- `ActionToggle` — self-contained toggle button (Like / Bookmark / Download) with local `useState`; **state is not persisted** and resets if the theater re-mounts.

**Architecture.**
- `SUBJECT_POSTER` — Tailwind gradient strings keyed by `SubjectId` used as the "video" backdrop (no real video element).
- `usePlayback` reads `videoProgress[videoId]?.fraction ?? 0` from the store on every render and advances it via `setVideoProgress` on a `setInterval(…, 250)`:
  ```ts
  const next = Math.min(1, cur + (speed * 1) / video.durationSec)
  setVideoProgress(videoId, next)
  accRef.current += speed
  if (accRef.current > 60) { accRef.current = 0 }   // ← dead accumulator
  if (next >= 1) setPlaying(false)
  ```
- Theater modal: stage (poster + center play/pause) + controls row + Up Next sidebar (hidden on mobile / fullscreen).
- Up Next queue: `useMemo` over `videos.filter(v => v.chapterId === theater.video.chapterId)`, returns up to 6 starting from the current video.
- PiP: fixed bottom-right card with progress bar, play/pause, restore-to-theater, close. Clicking the PiP surface also restores.

**Code-quality issues.**
- **Dead accumulator in `usePlayback`** (lines 71-75): `accRef.current += speed; if (accRef.current > 60) accRef.current = 0` — the comment says "bump study hours occasionally" but `addStudyHours` is never called. Pure dead code; should either wire up `addStudyHours` or delete the block.
- **`muted` state is unused** — the `muted` toggle flips the icon (Volume2 ↔ VolumeX) but has no audio effect (there's no actual media element). Same for the Like/Bookmark/Download `ActionToggle`s (local-only state).
- **`Seekbar` has `role="slider"` and `tabIndex={0}` but no `onKeyDown`** — keyboard users can focus the seekbar but cannot move it. Should handle ArrowLeft/ArrowRight/Home/End to call `onSeek`.
- **`toggleFullscreen` swallows errors silently**: `containerRef.current?.requestFullscreen?.().catch(() => {})` — if fullscreen is blocked, no UI feedback.
- **`aria-current={isCurrent ? 'true' : undefined}`** on Up Next buttons — `'true'` is technically valid per WAI-ARIA but `'page'`/`'location'` is more conventional. Minor.
- **No focus trap** inside the theater dialog (despite `role="dialog" aria-modal="true"` and `tabIndex={-1}` with focus-on-open — good). Tab can escape to elements behind.
- **`Space` shortcut uses `e.code === 'Space'`** — works regardless of layout, but `e.key === ' '` is more idiomatic. Minor.
- **`openTheater` keyboard handler depends on `[theaterVideoId, closeTheater, theater]`** — `theater` is the whole `usePlayback` return object, recreated every render (every 250ms during playback), so the effect re-subscribes the listener every 250ms while playing. Should split into stable callbacks or depend on the specific methods used (`theater.setPlaying`, `theater.speed`).
- **Inconsistent seek write paths**: the keyboard handler calls `useStore.getState().setVideoProgress(…)` directly, the Seekbar `onSeek` callback also calls `useStore.getState().setVideoProgress(…)`, the rewind/forward buttons use the same. All bypass `usePlayback`'s encapsulation. Acceptable but worth noting.

**Accessibility.**
- Theater dialog: `role="dialog" aria-modal="true" aria-label="Now playing: …"`, `tabIndex={-1}`, focused on open via deferred setTimeout (good).
- All controls have `aria-label` and `title`.
- `Seekbar` exposes `aria-valuemin/max/now` but no keyboard handler.
- PiP surface: `role="button" tabIndex={0}` with `onKeyDown` for Enter/Space — good.
- Up Next items: real `<button>`s with `aria-current` on the active one.
- Equalizer animation on the "Now playing" item is decorative (no `aria-hidden` on the animated bars — screen readers may announce them).

**Mobile / responsive.** Theater is `max-w-[1280px] h-[88vh]`; Up Next sidebar `hidden md:flex`; controls gap `gap-2 sm:gap-3`. PiP is `w-[320px] max-w-[calc(100vw-2.5rem)]`. Seekbar hover tooltip is mouse-only — no touch equivalent.

**Performance.**
- Two `usePlayback` instances (theater + PiP) but only one is active at a time (store guarantees mutual exclusion via `enterPip`/`restoreFromPip`).
- During playback, `setVideoProgress` fires every 250ms → whole `VideoLayer` re-renders. Over-subscription via `useStore()` (destructures 8 things).
- `useEffect` for keyboard re-subscribes every 250ms during playback (because `theater` reference changes).
- `Seekbar` is not memoized — re-renders on every progress tick (cheap, but a `React.memo` would skip when `fraction` is unchanged).

---

### `src/components/delta/ui.tsx` (456 lines)

**Purpose.** Delta's in-house design-system primitives (lives next to — not inside — `src/components/ui/*` shadcn). All components are pure styled wrappers using the custom Tailwind utilities defined in `globals.css` (`glass`, `glass-strong`, `elev-1/2/3`, `hairline`, `ambient`, `scroll-thin`, etc.).

**Public exports.**
| Primitive | Purpose |
|---|---|
| `GlassCard` | Surface (glass / glass-strong) with optional `hover` lift. |
| `PageHeader` | Title + subtitle + icon + actions row used at the top of each page. |
| `Divider` | Full-width `hairline`. |
| `Pill` | Rounded pill toggle button (active = cream background). |
| `IconButton` | 36px round button with required `label` (aria-label). |
| `PrimaryButton` | Filled primary CTA with disabled state. |
| `GhostButton` | Bordered subtle CTA. |
| `ProgressRing` | SVG circular progress (0..1 value, animated stroke-dashoffset). |
| `StatNumber` | Big metric numeral with the quirky `,77,32%` reference-style formatting (renders `,whole,frac` + suffix). |
| `MetricCard` | `GlassCard` with label, value, sub, optional trend chip. |
| `Badge` | Tonal badge (default / primary / success / warning / destructive). |
| `Toggle` | `role="switch"` toggle with `aria-checked`. |
| `Segmented<T>` | Generic segmented control. |
| `Avatar` | Initials avatar (no image), `aria-hidden`. |
| `SectionShell` | 16:9-ish viewport-height section wrapper (`height: calc(100vh - 64px)` — assumes 64px header). |
| `EmptyState` | Icon + title + hint + optional CTA. |
| `Skeleton` | `animate-pulse` placeholder. |
| `ListRow` | List row that becomes a `<button>` if `onClick` is supplied (good semantic flexibility). |

**Relationship to shadcn/ui.**
- shadcn primitives live in `src/components/ui/*` (`button`, `card`, `avatar`, `badge`, `dialog`, `toast`, etc. — full shadcn kit installed).
- The Delta `ui.tsx` is **separate and parallel**, not built on shadcn. Delta components import only from `./ui` (the local kit) and never from `@/components/ui/*`.
- The only consumer of shadcn primitives is the shadcn scaffolding itself: `useToast` ↔ `Toaster` (`@/components/ui/toaster`), `useIsMobile` ↔ `Sidebar` (`@/components/ui/sidebar`). The `Toaster` is mounted in `app/layout.tsx` but `useToast`/`toast` is **not called anywhere in the Delta codebase** — the toast system is installed but unused.

**Code-quality issues.**
- **`Avatar` initials edge case**: `name.split(' ').map((p) => p[0]).slice(0, 2).join('')` — for an empty name, returns `''`; for a single-word name, returns just the first letter. No `?` fallback (unlike the onboarding avatar preview which does fall back to `?`). Also `p[0]` is `undefined` if a "word" is somehow empty (e.g. double space) — would render `undefined` as a string.
- **`Toggle` thumb translate** uses `translate-x-5.5` — works under Tailwind v4 (fractional spacing via `--spacing: 0.25rem` → 1.375rem) but is fragile; the track is `w-11` (2.75rem), thumb `size-4` (1rem), so the math is tight.
- **`StatNumber`'s "comma-separated" rendering** is bizarre: it intersperses muted `,` glyphs between whole and fractional parts (e.g. rendering `77.32%` as `,77,32%`). The comment references "the reference" (likely a design mock). Looks intentional but easy to misread as a bug.
- **`SectionShell` hard-codes `100vh - 64px`** — couples to the 64px header height. If TopNav height changes, SectionShell breaks silently.
- `ListRow` uses `const Comp = onClick ? 'button' : 'div'` — works, but TypeScript may complain about ref/props typing in stricter setups.

**Accessibility.** Generally strong: `IconButton` requires `label`, `Toggle` uses `role="switch"`, `Avatar` is `aria-hidden`, `ListRow` becomes a `<button>` when interactive. `Pill` has no `aria-pressed` for toggleable use — could be added when `active` is supplied.

**Mobile / responsive.** All primitives are unitless / em-based; sizing is left to the caller. `PageHeader` truncates title and subtitle on narrow widths. `SectionShell` uses `100vh` which on mobile browsers can misbehave with URL-bar show/hide (`100dvh` would be safer).

**Performance.** No memoization; primitives are cheap. `ProgressRing` recomputes circumference each render (fine).

---

### `src/lib/mock-data.ts` (429 lines)

**Purpose.** Deterministic seeded mock data using `mulberry32(20260616)` so SSR/CSR and reloads stay consistent.

**Public exports.**
- Types: `SubjectId`, `Subject`, `Chapter`, `Video`, `TestItem`, `Question`, `NoteItem`, `LeaderEntry`, `Achievement`, `LiveSession`.
- Data: `SUBJECTS`, `chapters`, `videos`, `tests`, `notes`, `leaderboard`, `activity`, `achievements`, `liveSessions`, `doubts`, `testHistory`, `studyHours`, `scoreTrend`, `subjectCompletion`.
- Helpers: `buildQuestions(count)`, `fmtDuration(sec)`.

**Entity model.**
| Entity | Shape | Count |
|---|---|---|
| `Subject` | `{ id, name, icon, color }` — `icon` is a lucide icon name string, `color` is an oklch string | 6 (physics, chemistry, maths, biology, cs, english) |
| `Chapter` | `{ id, subjectId, number, title, topicCount, durationMin }` | 6 subjects × 12 chapters = **72** |
| `Video` | `{ id, chapterId, subjectId, number, title, instructor, durationSec }` — id format `<subject>-c<ch>-v<n>` | 72 × 5 = **360** |
| `TestItem` | `{ id, name, type, subject, questionCount, durationMin, deadlineHours, difficulty }` — `type` union, `deadlineHours: number \| null` | **54** |
| `Question` | `{ id, text, options[], correctIndex, explanation, subject }` — generated from `QUESTION_BANK` (Physics/Chemistry/Maths, 2 each) | via `buildQuestions(n)` |
| `NoteItem` | `{ id, title, subject, content, tags[], updatedAt }` | **28** |
| `LeaderEntry` | `{ id, name, score, streak, change, batch, rank, you? }` — sorted desc by score, rank re-assigned post-sort; "you" injected at rank 47 | **1000** |
| `Achievement` | `{ id, title, description, category, rarity, icon, earned, earnedAt, progress }` — 16 hand-authored entries | **16** |
| `LiveSession` | `{ id, subject, topic, instructor, startsInHours, viewers, isLive }` | **5** (1 live + 4 upcoming) |
| `Doubt` (inline shape, not exported as interface) | `{ id, text, subject, asker, answers, upvotes, hoursAgo, resolved, mine }` | **8** |
| `testHistory` row (inline) | `{ id, name, type, subject, daysAgo, score, total, timeTaken, trend }` | **24** |
| `activity` (inline) | `{ id, type, label, minutesAgo }` — 6 templates cycling | **18** |
| `studyHours` | `{ day, hours }` — 30 days, skewed | **30** |
| `scoreTrend` | `{ test, score }` | **12** |
| `subjectCompletion` | `{ subject, value }` — first 5 subjects | **5** |

**Notable patterns.**
- `mulberry32` PRNG seeded with `20260616` — fully deterministic across reloads.
- `pick`, `between`, `round2` helpers.
- `videos` and `chapters` are built by nested iteration over `SUBJECTS` × `CHAPTER_TITLES[subject]` × 5 videos per chapter.
- `leaderboard` is generated as 1000 entries, then **sorted by score desc and ranks re-assigned** so standings stay strictly monotonic (the comment explicitly notes that seeded score noise would otherwise leave rank #3 occasionally outscoring rank #2).
- `leaderboard[46]` is then patched to be "you" (Aryan Sharma, Nucleus 2026) — keeping the score so the ordering stays consistent.
- `fmtDuration(sec)` returns `M:SS` (no leading zero on minutes).

**Interactions.** Imported by `store.ts` (seed `videoProgress`, `notes`, `testHistory`), `spotlight.tsx` (videos/tests/SUBJECTS), `video-player.tsx` (videos/chapters/SUBJECTS/fmtDuration), `onboarding.tsx` (SUBJECTS), and most page components.

**Code-quality issues.**
- The `Doubt` type is **not exported as an interface** — `doubts.tsx` page locally redefines `Doubt[]` and casts via `as Doubt[]`. Should export `interface Doubt` from mock-data for type safety.
- Same for `testHistory`, `activity`, `studyHours`, `scoreTrend`, `subjectCompletion` row shapes — all inline, no exported interfaces.
- `GENERIC_SUBJECTS = ['Physics', 'Chemistry', 'Maths']` is hardcoded — won't include biology/cs/english even though those subjects exist. Same with `SUBJECT_NAMES = ['Physics', 'Chemistry', 'Maths', 'Full Syllabus']` for tests. Biology/CS/English students get a sparse experience.
- `QUESTION_BANK` only has Physics/Chemistry/Maths — `buildQuestions` returns nothing for biology/cs/english tests.
- `subjectCompletion` slices `SUBJECTS.slice(0, 5)` — silently drops english.

---

### `src/lib/store.ts` (352 lines)

**Purpose.** The single global Zustand store, persisted to `localStorage` under the key `project-delta-v1`.

**Public exports.**
- Types: `TabId` (13 union members), `UserProfile`, `WidgetState`, `VideoProgress`, `HistoryRow`.
- `useStore` — the Zustand hook.
- `useSubjectProgress()` / `useTotalHours()` — derived selector hooks (memoized on `videoProgress`).

**Store shape.**
| Slice | Field(s) | Notes |
|---|---|---|
| Navigation | `activeTab`, `setTab`, `cycleTab(dir)` | `cycleTab` order has only 10 of 13 tabs (see issues) |
| Spotlight | `spotlightOpen`, `setSpotlight` | |
| Onboarding | `onboardingDone`, `finishOnboarding` | |
| Profile | `profile`, `setProfile(patch)` | `UserProfile` = name/location/bio/targetYear/batch/examName |
| Progress | `videoProgress: Record<id, {fraction, completed}>`, `setVideoProgress`, `markVideoComplete`, `subjectProgress()`, `totalHours()` | `seedProgress()` deterministically seeds each subject to a distinct target completion (physics 0.71, …, english 0.25) |
| Streak/goals | `streak`, `dailyGoalHours`, `hoursToday`, `setDailyGoal`, `addStudyHours`, `customCountdownDate`, `countdownLabel`, `setCountdown` | `addStudyHours` caps at `dailyGoalHours + 2` |
| Notes | `notes: NoteItem[]`, `addNote`, `updateNote`, `deleteNote`, `quickScratch`, `setQuickScratch` | Seeded from `mock-data.notes` |
| Tests | `history: HistoryRow[]`, `submitTest` | Seeded from `mock-data.testHistory` |
| Widgets | `widgets: WidgetState[]`, `gridMode`, `setGridMode`, `updateWidget`, `bringToFront`, `removeWidget`, `addWidget`, `resetWidgets` | 12 default widgets |
| Video modal | `theaterVideoId`, `pipVideoId`, `openTheater`, `closeTheater`, `enterPip`, `closePip`, `restoreFromPip` | Mutual exclusion: `openTheater` clears pip; `enterPip` moves theater→pip |
| Live | `liveAttended`, `setLiveAttended` | |

**Persistence strategy.**
- `persist` middleware with `name: 'project-delta-v1'`.
- `partialize` explicitly whitelists: `videoProgress, streak, dailyGoalHours, hoursToday, customCountdownDate, countdownLabel, notes, quickScratch, history, widgets, gridMode, onboardingDone, liveAttended, profile`.
- **Not persisted**: `activeTab`, `spotlightOpen`, `theaterVideoId`, `pipVideoId` — sensible (transient UI state).
- No `version` field — schema changes will silently mis-parse existing localStorage. Adding `version: 1` + `migrate` is recommended before any breaking change.

**Derived selectors.**
```ts
export function useSubjectProgress(): Record<SubjectId, number> {
  const vp = useStore((s) => s.videoProgress)
  return useMemo(() => useStore.getState().subjectProgress(), [vp])
}
```
Correct pattern: subscribe only to `videoProgress`, then call the getter inside `useMemo`. The accompanying comment explicitly warns that calling the raw getter inside a selector returns a fresh reference each render and triggers an infinite loop — good documentation of a footgun.

**Code-quality issues.**
- **`cycleTab` order array is missing 3 tabs**: `['home', 'library', 'tests', 'notes', 'live', 'analytics', 'leaderboard', 'achievements', 'profile', 'settings']` — no `syllabus`, `doubts`, `playground`. If `activeTab` is one of those, `indexOf` returns -1, and pressing ArrowRight from "syllabus" jumps to `order[0]` (home); ArrowLeft jumps to `order[9]` (settings). Inconsistent with the visible TopNav (which also omits them) and with Spotlight (which includes syllabus + doubts but not playground).
- **`markVideoComplete` is dead code** — defined on the store but never called by any component. `setVideoProgress` already marks `completed: true` when `fraction >= 0.98`, so `markVideoComplete` is redundant.
- **`addWidget` always spawns widgets at the same `{ x: 80, y: 200 }`** — adding multiple widgets stacks them on top of each other. Should offset by widget count or randomize.
- **`addStudyHours` cap** `Math.min(dailyGoalHours + 2, …)` — once the user hits `dailyGoalHours + 2`, further `addStudyHours` calls are no-ops. May be intentional (anti-grind), but surprising.
- `setVideoProgress` uses `fraction >= 0.98 || (s.videoProgress[id]?.completed ?? false)` to set `completed` — the `||` means a video that was once marked complete stays complete even if the user seeks back to 0. Reasonable UX.
- `seedProgress()` calls `chapters.find((c) => c.id === a.chapterId)!.number` — uses non-null assertion. Safe because mock data guarantees the relation, but defensive code would return 0 on miss.
- `partialize` doesn't persist `notes` ordering in a versioned way — fine for now.

**Interactions.** Imported by every delta component and most pages. The `useStore()` (no-selector) pattern in `AppShell`, `TopNav`, `Spotlight`, `Onboarding`, `VideoLayer`, `HomePage` causes broad re-renders on every state change.

---

### `src/lib/utils.ts` (6 lines)

**Purpose.** The standard shadcn `cn` helper.
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```
Used everywhere across delta + shadcn. No issues.

---

### `src/app/api/route.ts` (5 lines)

**Purpose.** Default Next.js Route Handler scaffold.
```ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}
```
**Dead scaffold.** No delta component fetches `/api` or `/api/route`. Should either be deleted or wired to something real (e.g. progress sync, AI doubts).

---

### `src/hooks/use-mobile.ts` (19 lines)

**Purpose.** Standard shadcn `useIsMobile()` hook. Returns `!!isMobile` based on a 768px breakpoint.

**Patterns.** `useState<boolean | undefined>(undefined)` initially, then `useEffect` adds a `matchMedia` listener and sets state. Returns `!!isMobile` so the initial SSR value is `false` (avoids hydration mismatch).

**Usage.** Imported only by `src/components/ui/sidebar.tsx`. **Not used by any delta component** — Delta handles responsive layout with Tailwind breakpoints (`md:`, `sm:`) inline.

**Code-quality issues.**
- The hook re-evaluates `window.innerWidth < MOBILE_BREAKPOINT` on every `change` event but only reads `window.matchMedia` for the listener — could use `mql.matches` directly. Minor.
- Initial `undefined` means the first client paint returns `false`, which may flash desktop layout on mobile before effect runs. Acceptable tradeoff for SSR safety.

---

### `src/hooks/use-toast.ts` (194 lines)

**Purpose.** Standard shadcn toast manager (reducer + listener pattern, `useToast` hook + `toast()` imperative API).

**Patterns.** Module-level `memoryState` + `listeners` array. `dispatch` runs the reducer and notifies all subscribed `setState` listeners. `useToast` subscribes via `useEffect`.

**Usage.** Imported by `src/components/ui/toaster.tsx` (mounted in `app/layout.tsx`). **`useToast`/`toast` is never called anywhere in the delta codebase** — the toaster is rendered but never triggered. Effectively dead infrastructure.

**Code-quality issues.**
- **`TOAST_REMOVE_DELAY = 1000000`** (≈16 minutes). Standard shadcn value is 1000ms. The 16-minute delay means dismissed toasts linger in component state for that long. Probably intentional to allow exit animations, but the value is unusually large.
- **`useEffect` dependency `[state]`** (line 185) — re-registers the listener on every state change. Since React's `setState` is stable, the unsubscribe/resubscribe is harmless but wasteful. Should be `[]`.
- `TOAST_LIMIT = 1` — only one toast visible at a time. New toasts replace old ones.
- `genId` uses a module-level `count` counter — fine for client-only, but if SSR ever calls `toast()` the count would diverge between server and client.

---

## 2. Cross-cutting summaries

### Mock-data model recap
- 6 subjects × 12 chapters × 5 videos = **360 videos** deterministically generated.
- 54 tests, 28 notes, 1000 leaderboard entries (sorted, "you" patched at rank 47), 16 achievements (hand-authored), 5 live sessions, 8 doubts, 24 test-history rows, 18 activity items, 30-day study-hours series, 12-test score trend, 5-subject completion summary.
- Helper `buildQuestions(n)` draws from a tiny 6-question bank (Physics/Chemistry/Maths only — biology/cs/english tests get no questions).
- Helper `fmtDuration(sec)` returns `M:SS`.
- Several inline row shapes (Doubt, Activity, HistoryRow, etc.) lack exported interfaces — downstream code redefines them.

### Zustand store recap
- Single store, `persist` middleware, `localStorage` key `project-delta-v1`, no `version`.
- 13 `TabId` values but `cycleTab` + `TopNav TABS` only cover 10 — `syllabus`/`doubts`/`playground` are reachable only via Spotlight (12 of 13) or in-page buttons (Playground only).
- `partialize` persists 13 slices; transient UI state (activeTab, spotlightOpen, theater/pip IDs) is intentionally not persisted.
- `useSubjectProgress` / `useTotalHours` are correctly memoized selector hooks (subscribe to `videoProgress` only).
- `markVideoComplete` is dead code.
- Pervasive `useStore()` (no-selector) pattern in shell components causes re-renders on every state change, including the 250ms playback tick.

### UI primitives recap
- `delta/ui.tsx` exports ~20 primitives (GlassCard, PageHeader, Divider, Pill, IconButton, PrimaryButton, GhostButton, ProgressRing, StatNumber, MetricCard, Badge, Toggle, Segmented, Avatar, SectionShell, EmptyState, Skeleton, ListRow).
- Lives parallel to — and does not use — the shadcn kit in `src/components/ui/*`. Delta components import only from `./ui` (delta) and `@/lib/utils` (`cn`).
- shadcn `useToast`/`Toaster` is installed and mounted but never triggered.
- shadcn `useIsMobile`/`Sidebar` is installed but unused by delta (delta uses Tailwind breakpoints instead).
- All primitives rely on custom utilities defined in `globals.css`: `glass`, `glass-strong`, `elev-1/2/3`, `hairline`, `ambient`, `scroll-thin`, `scroll-none`, `snap-section`, `live-dot`. Custom CSS variables for `cream`, `success`, `warning` extend the shadcn default palette.

### Video-player architecture recap
- **Two layers**: Theater (modal, `z-[90]`) and PiP (fixed bottom-right card, `z-[95]`). Store enforces mutual exclusion — `enterPip` moves `theaterVideoId`→`pipVideoId`; `restoreFromPip` does the reverse.
- **Playback engine**: `usePlayback(videoId)` advances `videoProgress[videoId].fraction` by `(speed * 1) / video.durationSec` every 250ms via `setInterval`. When `fraction >= 1`, sets `playing = false`. There is no actual `<video>` element — the "player" is a stylized simulation.
- **Progress tracking**: All writes go to `videoProgress` in the store, which is persisted. `setVideoProgress` marks `completed: true` once `fraction >= 0.98`. `subjectProgress()` derives per-subject completion by counting completed videos.
- **Theater UI**: Stage (subject poster gradient + center play/pause + top-left subject/chapter + top-right close + bottom-left Completed badge) → Seekbar (chapter markers, hover tooltip) → controls row (rewind / play-pause / forward / time / speed / mute / PiP / fullscreen) → title + action toggles (Like/Bookmark/Download, all local-only state) → Up Next sidebar (6 videos from the same chapter, hidden on mobile / fullscreen).
- **PiP UI**: 320px-wide card with poster, center play/pause, restore-to-theater, close, bottom progress bar, title + instructor + time.
- **Keyboard shortcuts** (theater only): `Esc` close, `Space` play/pause, `←/→` seek ±10s, `F` fullscreen. Correctly bails when typing in inputs.
- **Up Next queue**: `useMemo` over videos in the same chapter, starting from the current video, wrapping if fewer than 6 follow.
- **Known dead code**: `accRef.current += speed; if (accRef.current > 60) accRef.current = 0` in `usePlayback` — comment says "bump study hours occasionally" but `addStudyHours` is never called.

### Spotlight / command palette recap
- Toggled by `⌘/Ctrl+K` (global listener) or by clicking the search button in TopNav.
- Searches pages, videos, tests, notes. Empty query shows 6 page entries; non-empty merges filtered pages + ≤5 videos + ≤4 tests + ≤3 notes (≤12 total).
- Navigation: `↑/↓` to move selection, `Enter` to open, `Esc` to close, hover to select.
- Opens video results in the theater via `openTheater(r.id)` — uses fragile `r.id.includes('-v')` check.
- **Missing from page list**: `playground` (reachable only via in-page buttons in Home/Settings).
- No `role="dialog"` / focus trap.

### Onboarding flow recap
- 5 steps: Welcome → Profile (name/exam/location/targetYear/bio) → Exam preset (JEE/NEET/Boards/GATE-CS/Language/Custom) → Subjects (toggle 6) → Daily goal slider (1–12 hrs).
- `choosePreset` pre-fills subjects (and exam name if blank) for non-custom presets.
- `canContinue` gates progress per step.
- `commit()` writes `profile`, `dailyGoal`, and `onboardingDone` to the store (with sensible fallbacks for blanks).
- **Skip button = commit()**: the "Skip" button at every step calls `commit()` directly, identical to the final "Enter Delta" button. So Skip doesn't actually skip — it commits with whatever is filled (defaulting to "Aryan Sharma" / "My Exam" if blank). Surprising UX.
- No Escape key, no `role="dialog"`, no focus trap.

### Dead code, unused imports, stale references
- **`store.ts` `markVideoComplete`** — never called anywhere. `setVideoProgress` already handles completion at `fraction ≥ 0.98`.
- **`video-player.tsx` `accRef` accumulator** — `accRef.current += speed; if (> 60) reset` does nothing; the comment about "bump study hours" is unfulfilled.
- **`video-player.tsx` `muted` state** — flips the volume icon but has no audio effect (no real media element).
- **`video-player.tsx` `ActionToggle` state** (Like/Bookmark/Download) — local-only, not persisted, lost on unmount.
- **`app/api/route.ts`** — Hello-world scaffold, not consumed by any component.
- **`use-toast.ts` / `Toaster`** — installed and mounted but `useToast`/`toast` is never called in the delta codebase.
- **`use-mobile.ts`** — used only by shadcn `Sidebar`; delta components use Tailwind breakpoints instead.
- **shadcn `ui/*` kit** — fully installed (49 files) but delta uses only `delta/ui.tsx` for primitives. The only shadcn pieces actually wired up are `Toaster` (in `layout.tsx`) and `Sidebar` (not rendered anywhere in delta).
- **`spotlight.tsx` `Compass` icon** — used (empty-state). No unused icon imports spotted in spotlight/onboarding/video-player (all imported icons are referenced).
- **`top-nav.tsx`** — `Bell`, `Search`, `Triangle` all used.
- **`app-shell.tsx`** — `Triangle` used in the loading screen; all page imports used in `ActivePage` switch.
- **Duplicated `<style>` keyframe definitions** — `fadeIn`, `popIn`, `fadeUp` are redefined in `app-shell.tsx`, `spotlight.tsx`, `onboarding.tsx`. Should be consolidated into `globals.css`.
- **`ui.tsx` `StatNumber`'s `,whole,frac` formatting** — almost certainly a design-mock artifact; looks like a bug if you don't know the reference.

### Known broken line — status
The task description flagged `const ounted, setMounted] = useState(false)` as a known broken line in `app-shell.tsx`. **The current file does NOT contain this bug.** Line 46 reads:
```ts
const [mounted, setMounted] = useState(false)
```
(verified byte-for-byte with `od -c`). Either it was already fixed before this analysis, or the task description's "known broken" note is stale. No other syntax-level breakage was found in any of the 12 files.

### Most actionable follow-ups
1. **Replace `useStore()` (no-selector) calls** in `AppShell`, `TopNav`, `Spotlight`, `Onboarding`, `VideoLayer` with per-slice selectors to stop the 250ms-tick re-renders during video playback.
2. **Fix `cycleTab` order** to include all 13 `TabId`s (or remove `syllabus`/`doubts`/`playground` from the type) — and align `TopNav TABS` and `Spotlight` page list with the same set.
3. **Delete `markVideoComplete`** from the store (dead code) or wire it up where completion should be one-shot.
4. **Delete `accRef` accumulator** in `usePlayback` or actually call `addStudyHours` when the threshold is crossed.
5. **Add keyboard handler to `Seekbar`** (ArrowLeft/Right/Home/End) so `role="slider"` is operable.
6. **Rename or reimplement the onboarding "Skip" button** so it actually skips (set `onboardingDone: true` without writing profile) instead of calling `commit()`.
7. **Add `role="dialog"` + focus trap** to `Spotlight` and `Onboarding` overlays.
8. **Remove duplicate `rounded-full`** in `top-nav.tsx` line 89.
9. **Replace `r.id.includes('-v')` in `spotlight.tsx`** with a `kind: 'page' | 'video' | 'test' | 'note'` discriminator on `Result`.
10. **Delete `src/app/api/route.ts`** or replace with a real handler.
11. **Either wire up `useToast`/`Toaster` or remove it** (and the `useToast` import in `layout.tsx`) to drop ~200 lines of unused infrastructure.
12. **Add `version: 1` + `migrate`** to the persist config before any schema change.
13. **Consolidate the duplicated `<style>` keyframes** into `globals.css`.
14. **Export proper interfaces** for `Doubt`, `Activity`, `HistoryRow` row shapes from `mock-data.ts` instead of redefining them downstream.
