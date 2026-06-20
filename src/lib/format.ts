/**
 * Global formatting utilities.
 *
 * Single source of truth for time/duration formatting across the app.
 * Previously duplicated as `timeAgo` (doubts, profile), `fmtAgo`
 * (dashboard-components), `fmtDeadline` (dashboard-components), and
 * `fmtDuration` (mock-data). All pages now import from here.
 */

/** Format a duration in seconds as `H:MM:SS` or `MM:SS`. */
export function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Format a deadline given in hours.
 *   <1h   → "<1h left"
 *   <24h  → "Xh left"
 *   else  → "Xd left"
 */
export function fmtDeadline(hours: number): string {
  if (hours < 1) return '<1h left'
  if (hours < 24) return `${Math.round(hours)}h left`
  return `${Math.round(hours / 24)}d left`
}

/**
 * Format a relative time given in minutes.
 *   0       → "just now"
 *   <60     → "Xm ago"
 *   <1440   → "Xh ago"
 *   else    → "Xd ago"
 */
export function fmtAgo(minutes: number): string {
  if (minutes <= 0) return 'just now'
  if (minutes < 1) return '<1m ago'
  if (minutes < 60) return `${Math.round(minutes)}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

/**
 * Format a relative time given in hours (used by the doubts feed).
 *   0       → "just now"
 *   <1      → "<1h ago"
 *   <24     → "Xh ago"
 *   else    → "Xd ago"
 */
export function timeAgo(hours: number): string {
  if (hours <= 0) return 'just now'
  if (hours < 1) return '<1h ago'
  if (hours < 24) return `${Math.round(hours)}h ago`
  return `${Math.round(hours / 24)}d ago`
}
