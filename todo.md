# Project Delta — Production Readiness Checklist

> **86 gaps** between current state and production.
> Generated from a full codebase audit on 2026-06-21.

## A. Security (CRITICAL) — 11 items

- [ ] 1. Add auth to content API routes (`/api/content/*`, `/api/community/*` are currently public)
- [ ] 2. Lock down FastAPI CORS (currently `allow_origins=["*"]`)
- [ ] 3. Add CSRF protection on POST routes (auth, sync, doubts)
- [ ] 4. Add rate limiting on auth (register/login) and AI routes
- [ ] 5. Add security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] 6. Move JWT secret to environment variable (currently hardcoded in config.py)
- [ ] 7. Add password complexity validation (any 1-char password works)
- [ ] 8. Add account lockout after failed login attempts
- [ ] 9. Enforce HTTPS (redirect HTTP → HTTPS in production)
- [ ] 10. Add input sanitization on user-generated content (notes, doubts) — prevent stored XSS
- [ ] 11. Validate `DATABASE_URL` on FastAPI startup — crash with clear error if misconfigured

## B. Data Layer (CRITICAL) — 7 items

- [ ] 12. Fix sync to pull + apply server data to the store (currently only pushes TO server, never pulls back — multi-device broken)
- [ ] 13. Add pagination to content API (`/api/content/videos` returns all 360 in one response)
- [ ] 14. Add composite database indexes for common query patterns
- [ ] 15. Add database migrations (currently using `create_all()` which can't alter existing tables)
- [ ] 16. Configure connection pooling for Postgres
- [ ] 17. Set up automated DB backups
- [ ] 18. Clear stale localStorage from old sessions (users with old data see mock data mixed with real)

## C. Authentication (CRITICAL) — 7 items

- [ ] 19. Add password reset / forgot password flow
- [ ] 20. Add email verification on registration
- [ ] 21. Wire OAuth (Google/GitHub) via NextAuth (installed but not configured)
- [ ] 22. Implement session refresh tokens (JWT expires in 7 days with no refresh)
- [ ] 23. Add token rotation for security
- [ ] 24. Add "remember me" option (currently always 7 days)
- [ ] 25. Invalidate JWT server-side on logout (currently token remains valid until expiry)

## D. Real-time (MAJOR) — 5 items

- [ ] 26. Add auth to Socket.io connections (currently anyone can connect and listen)
- [ ] 27. Add room-based isolation (users should only see their batch/cohort events, not all)
- [ ] 28. Add reconnection logic with state recovery (missed events are lost on disconnect)
- [ ] 29. Add backpressure handling for Socket.io
- [ ] 30. Persist real-time events (server restart loses all live state)

## E. Features (MAJOR) — 10 items

- [ ] 31. Replace fake video player with real video streaming (HLS/DASH, actual `<video>` element)
- [ ] 32. Replace `buildQuestions()` with real question bank from DB
- [ ] 33. Implement real live classes (video conferencing integration, "Join" button does nothing)
- [ ] 34. Wire leaderboard scoring (taking a test should update your rank — currently static seed data)
- [ ] 35. Wire achievement unlock logic (completing tests/streaks should unlock achievements — currently static)
- [ ] 36. Build notifications system (bell icon + toggles do nothing — no push, no email, no in-app center)
- [ ] 37. Make Spotlight search across the DB (currently searches page names + generated titles only)
- [ ] 38. Add file uploads (profile pictures, note attachments, doubt screenshots)
- [ ] 39. Build admin panel (manage users, content, moderate doubts)
- [ ] 40. Build content authoring UI (create/edit subjects, chapters, videos, tests from the app)

## F. Performance (MAJOR) — 8 items

- [ ] 41. Code-split the 13 pages (all ship in one bundle)
- [ ] 42. Add `next/image` for image optimization (no usage anywhere)
- [ ] 43. Configure CDN / static asset caching
- [ ] 44. Add SSR/SSG strategy (everything is client-rendered — no ISR, no static generation)
- [ ] 45. Lazy-load content per page (Library fetches all 360 videos even if user views 12)
- [ ] 46. Add PWA / service worker (app doesn't work offline despite "offline-first" architecture)
- [ ] 47. Add bundle analysis tooling
- [ ] 48. Lazy-load heavy components (recharts, framer-motion, video-player load eagerly)

## G. Error Handling & Resilience (MAJOR) — 7 items

- [ ] 49. Add global error handler on FastAPI (unhandled exceptions return 500 with stack trace)
- [ ] 50. Add retry logic on API calls (fetch failures show empty state with no retry)
- [ ] 51. Add offline detection with "you're offline" banner
- [ ] 52. Add loading skeletons to all pages (pages flash empty then populate)
- [ ] 53. Add custom 404 page (beyond Next.js default)
- [ ] 54. Add graceful degradation (if FastAPI is down, fall back to localStorage instead of erroring)
- [ ] 55. Add health check endpoint for Next.js app (FastAPI has one, Next.js doesn't)

## H. Testing (MAJOR) — 3 items

- [ ] 56. Write unit tests (currently zero test files)
- [ ] 57. Set up test infrastructure (Jest/Vitest config, Playwright/Cypress for e2e)
- [ ] 58. Write FastAPI tests (pytest fixtures, API test suite)

## I. DevOps & Infrastructure (MAJOR) — 8 items

- [ ] 59. Add Docker / docker-compose for all 3 services (Next.js, FastAPI, Socket.io)
- [ ] 60. Set up CI/CD pipeline (GitHub Actions, auto-deploy)
- [ ] 61. Add environment management (`.env.production`, `.env.staging`)
- [ ] 62. Add structured logging + log aggregation (currently stdout / file only)
- [ ] 63. Add monitoring / alerting (uptime, error tracking via Sentry, APM)
- [ ] 64. Automate DB backups
- [ ] 65. Configure SSL/TLS termination in Caddy
- [ ] 66. Write production Caddyfile (current is dev-only — port 81, no domain)

## J. UX / Polish (MEDIUM) — 9 items

- [ ] 67. Add empty states on all pages (Notes, Tests, Library show blank during loading)
- [ ] 68. Add offline indicator banner
- [ ] 69. Re-add toast notifications for user actions (Toaster was deleted — no feedback on save/delete)
- [ ] 70. Add keyboard shortcuts help overlay
- [ ] 71. Add mobile bottom-nav (pill nav overflows on mobile)
- [ ] 72. Add dark/light theme toggle (next-themes installed but unused — hardcoded dark)
- [ ] 73. Add onboarding re-run option (if skipped, user is stuck with default profile)
- [ ] 74. Add data export/import (can't export notes/progress)
- [ ] 75. Pass accessibility audit (focus traps in modals, screen reader testing, keyboard nav for 3D canvas)

## K. Internationalization (LOW) — 3 items

- [ ] 76. Wire `next-intl` for multi-language support (installed, all strings hardcoded English)
- [ ] 77. Add RTL support for Arabic/Hebrew
- [ ] 78. Add locale-aware date/number formatting (currently hardcoded `en-US`)

## L. Content & Data Quality (LOW) — 4 items

- [ ] 79. Replace generic seed questions with real question bank
- [ ] 80. Add content moderation (profanity filter, report/flag system for doubts/notes)
- [ ] 81. Add content versioning (track updates to videos/chapters)
- [ ] 82. Add per-track content to the DB (Software Developer subjects have no DB content — show empty)

## M. Documentation (LOW) — 4 items

- [ ] 83. Update README with current architecture + setup guide
- [ ] 84. Write API documentation (FastAPI has `/docs` but no written reference)
- [ ] 85. Write architecture document (current-state, not history)
- [ ] 86. Write deployment guide

---

## Summary

| Severity | Count |
|---|---|
| 🔴 CRITICAL (security + data + auth) | 25 |
| 🟠 MAJOR (features + performance + errors + testing + devops) | 40 |
| 🟡 MEDIUM (UX polish) | 9 |
| 🟢 LOW (i18n + content + docs) | 12 |
| **Total** | **86** |
