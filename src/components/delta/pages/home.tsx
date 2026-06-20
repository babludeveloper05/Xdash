'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useStore, type WidgetState } from '@/lib/store'
import { WIDGET_REGISTRY } from './widget-content'
import { GlassCard, GhostButton, PrimaryButton, EmptyState } from '../ui'
import { Sparkles, LayoutGrid, Pencil } from 'lucide-react'
import { staggerContainer, staggerItem, itemTransition } from '@/lib/motion'

export function HomePage() {
  const { widgets, gridMode, setTab } = useStore()
  const reduce = useReducedMotion() ?? false
  const canvasHeight = widgets.reduce((m, w) => Math.max(m, w.y + w.h), 0) + 56

  return (
    <motion.div
      className="relative w-full min-h-[calc(100vh-64px)] flex flex-col"
      variants={staggerContainer(reduce)}
      initial="initial"
      animate="animate"
    >
      <style>{`
        @keyframes deltaWidgetIn {
          from { opacity: 0; transform: translateY(8px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .delta-widget-enter { animation: deltaWidgetIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Sticky glass header */}
      <motion.header
        variants={staggerItem(reduce)}
        transition={itemTransition(reduce)}
        className="sticky top-0 z-30 glass-strong border-b border-border"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center size-9 rounded-xl bg-primary/12 text-primary border border-primary/15 shrink-0">
              <LayoutGrid className="size-4" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight truncate">Dashboard</h1>
              <p className="text-xs text-muted-foreground truncate">
                Your personalized command center
              </p>
            </div>
          </div>
          <GhostButton onClick={() => setTab('playground')} className="shrink-0">
            <Sparkles className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Customize</span>
            <span className="sm:hidden">Edit</span>
          </GhostButton>
        </div>
      </motion.header>

      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="flex-1 min-h-0">
        {widgets.length === 0 ? (
          <EmptyDashboard onOpen={() => setTab('playground')} />
        ) : gridMode ? (
          <GridDashboard widgets={widgets} />
        ) : (
          <>
            {/* lg+ : free-form absolute canvas, centered, horizontal scroll on overflow */}
            <div className="hidden lg:block w-full overflow-x-auto scroll-thin">
              <div
                className="relative mx-auto px-6 py-5"
                style={{ width: 1448, minHeight: canvasHeight }}
              >
                {widgets.map((w, i) => (
                  <GlassCard
                    key={w.id}
                    className="absolute p-4 group delta-widget-enter"
                    style={{
                      left: w.x,
                      top: w.y,
                      width: w.w,
                      height: w.h,
                      zIndex: w.z,
                      animationDelay: `${Math.min(i * 30, 300)}ms`,
                    }}
                  >
                    <div className="h-full overflow-hidden">
                      {WIDGET_REGISTRY[w.type]?.render()}
                    </div>
                    <button
                      onClick={() => setTab('playground')}
                      aria-label="Edit layout in playground"
                      className="absolute right-2 top-2 z-10 size-6 grid place-items-center rounded-full bg-background/60 border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Below lg : responsive grid fallback so widgets never clip */}
            <div className="lg:hidden">
              <GridDashboard widgets={widgets} />
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Responsive grid layout (used on mobile, tablet, and grid mode)     */
/* ------------------------------------------------------------------ */

function GridDashboard({ widgets }: { widgets: WidgetState[] }) {
  return (
    <div
      className="p-4 sm:p-5 grid gap-4 delta-widget-enter"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
      }}
    >
      {widgets.map((w, i) => (
        <GlassCard
          key={w.id}
          className="relative p-4 sm:p-5"
          style={{
            minHeight: w.type === 'greeting' ? 88 : 200,
            animationDelay: `${Math.min(i * 30, 300)}ms`,
          }}
        >
          <div className="h-full overflow-hidden">{WIDGET_REGISTRY[w.type]?.render()}</div>
        </GlassCard>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyDashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex-1 grid place-items-center p-5">
      <div className="max-w-md w-full">
        <EmptyState
          icon={<LayoutGrid className="size-6" />}
          title="Your dashboard is empty"
          hint="Head to the Playground to add widgets and arrange your personalized command center."
          cta={
            <PrimaryButton onClick={onOpen} className="mt-1">
              <Sparkles className="size-4" /> Open Playground
            </PrimaryButton>
          }
        />
      </div>
    </div>
  )
}
