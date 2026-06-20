import type { Transition, Variants } from 'framer-motion'

/**
 * Motion token system for Project Delta.
 *
 * Single source of truth for spring presets, stagger timing, and reduced-motion
 * fallbacks. Every animated surface — page transitions, the nav pill, section
 * cascades — pulls from these constants so motion stays consistent and tunable
 * from one place.
 *
 * Design principles (per the cinematic-nav brief):
 *  - Springs (not duration-based easing) for primary motion — natural settle.
 *  - Direction-aware page variants (slide follows nav direction).
 *  - `prefers-reduced-motion` degrades everything to a near-instant crossfade
 *    with no directional slide and no stagger.
 */

// --- Spring presets ---------------------------------------------------------

/** Primary spring — page transitions. Deliberate, with a gentle settle. */
export const pageSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 32,
  mass: 1,
}

/** Secondary spring — micro-interactions (nav pill glide). Snappier than pages. */
export const navSpring: Transition = {
  type: 'spring',
  stiffness: 700,
  damping: 40,
  mass: 0.7,
}

/** Section/item entrance spring — same family as the page spring, slightly lighter. */
export const itemSpring: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 30,
  mass: 0.9,
}

// --- Stagger timing ---------------------------------------------------------

/** Offset between cascading sections (70ms — inside the 40–80ms target band). */
export const STAGGER_INTERVAL = 0.07

/** Small initial delay so the page-slide leads and sections follow it in. */
export const STAGGER_DELAY_CHILDREN = 0.05

// --- Reduced-motion fallback ------------------------------------------------

/** Near-instant crossfade used when `prefers-reduced-motion: reduce` is set. */
export const reducedTransition: Transition = {
  duration: 0.18,
  ease: [0.4, 0, 0.2, 1],
}

// --- Page transition (direction-aware) --------------------------------------

/** Pixel distance for the directional page slide. */
const PAGE_DISTANCE = 64

/**
 * Context passed via AnimatePresence `custom` (and mirrored on the motion.main
 * itself) so both entering and exiting pages resolve their variants against the
 * same direction + reduced-motion state.
 */
export interface PageTransitionCtx {
  /** 1 = forward (moving right in the nav), -1 = backward (moving left). */
  dir: number
  /** True when the user prefers reduced motion. */
  reduce: boolean
}

/**
 * Page-level variants.
 *
 * The exiting page receives the NEW direction (via the `custom` prop on
 * AnimatePresence) so it exits toward the side the incoming page is entering
 * from — producing one continuous directional sweep with no dead frame.
 *
 * Parallax depth: alongside the x-slide, a subtle scale dolly makes the
 * incoming page start smaller (further away) and the outgoing page grow as
 * it leaves (passing closer to the viewer). Combined with the slide this
 * reads as a 3D parallax pass-through rather than a flat 2D swap.
 *
 * Under reduced motion, both enter and exit collapse to a plain opacity tween.
 */
export const pageVariants = {
  initial: ({ dir, reduce }: PageTransitionCtx) =>
    reduce
      ? { opacity: 0 }
      : { opacity: 0, x: dir > 0 ? PAGE_DISTANCE : -PAGE_DISTANCE, scale: 0.96 },
  animate: ({ reduce }: PageTransitionCtx) =>
    reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 },
  exit: ({ dir, reduce }: PageTransitionCtx) =>
    reduce
      ? { opacity: 0 }
      : { opacity: 0, x: dir > 0 ? -PAGE_DISTANCE : PAGE_DISTANCE, scale: 1.04 },
} as Variants

/**
 * Parallax background variants — for a depth layer BEHIND the page.
 *
 * Moves at ~0.35x the page slide distance and with a milder scale, so the
 * background drifts slower than the foreground content during transitions.
 * This multi-layer differential is what creates the parallax depth illusion
 * (foreground fast, background slow = perceived distance).
 *
 * Under reduced motion, collapses to opacity-only.
 */
export const parallaxBgVariants = {
  initial: ({ dir, reduce }: PageTransitionCtx) =>
    reduce
      ? { opacity: 0 }
      : { opacity: 0, x: dir > 0 ? PAGE_DISTANCE * 0.35 : -PAGE_DISTANCE * 0.35, scale: 1.015 },
  animate: ({ reduce }: PageTransitionCtx) =>
    reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 },
  exit: ({ dir, reduce }: PageTransitionCtx) =>
    reduce
      ? { opacity: 0 }
      : { opacity: 0, x: dir > 0 ? -PAGE_DISTANCE * 0.35 : PAGE_DISTANCE * 0.35, scale: 1.015 },
} as Variants

/** Resolve the transition for a page based on the reduced-motion flag. */
export function pageTransition(reduce: boolean): Transition {
  return reduce ? reducedTransition : pageSpring
}

// --- Section stagger helpers (Phase 4) --------------------------------------

/**
 * Container variant — orchestrates staggered children.
 *
 * Under reduced motion the container is a no-op (no stagger), so children fall
 * back to their own crossfade without any directional or temporal offset.
 */
export function staggerContainer(reduce: boolean): Variants {
  if (reduce) return { initial: {}, animate: {} }
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: STAGGER_INTERVAL,
        delayChildren: STAGGER_DELAY_CHILDREN,
      },
    },
  }
}

/**
 * Item variant — fades in and lifts up slightly. Applied to each top-level
 * section of a page so the cascade reads as a choreographed reveal rather than
 * a single block appearing at once.
 */
export function staggerItem(reduce: boolean): Variants {
  if (reduce) {
    return { initial: { opacity: 0 }, animate: { opacity: 1 } }
  }
  return { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } }
}

/** Resolve the transition for a stagger item based on the reduced-motion flag. */
export function itemTransition(reduce: boolean): Transition {
  return reduce ? reducedTransition : itemSpring
}
