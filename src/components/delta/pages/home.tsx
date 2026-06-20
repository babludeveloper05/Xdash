'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { WIDGET_REGISTRY } from './widget-content'
import { GlassCard, PrimaryButton, EmptyState } from '../ui'
import { Sparkles, LayoutGrid, Pencil } from 'lucide-react'
import { staggerContainer, staggerItem, itemTransition } from '@/lib/motion'

export function HomePage() {
  const widgets = useStore((s) => s.widgets)
  const setTab = useStore((s) => s.setTab)
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

      <motion.div variants={staggerItem(reduce)} transition={itemTransition(reduce)} className="flex-1 min-h-0">
        {widgets.length === 0 ? (
          <EmptyDashboard onOpen={() => setTab('playground')} />
        ) : (
          /*
           * Free-form absolute canvas — the only layout.
           * Widgets are positioned at fixed x/y coordinates on a 1448px-wide
           * canvas. On viewports narrower than the canvas the container scrolls
           * horizontally (overflow-x-auto) so the arrangement is preserved at
           * every screen size rather than collapsing to a grid.
           */
          <div className="w-full overflow-x-auto scroll-thin">
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
        )}
      </motion.div>
    </motion.div>
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
