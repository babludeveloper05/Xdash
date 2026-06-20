'use client'

import { motion } from 'framer-motion'
import { useStore, type TabId } from '@/lib/store'
import { Avatar, IconButton } from './ui'
import { cn } from '@/lib/utils'
import { Bell, Search, Triangle } from 'lucide-react'
import { navSpring } from '@/lib/motion'

const TABS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'library', label: 'Library' },
  { id: 'tests', label: 'Tests' },
  { id: 'notes', label: 'Notes' },
  { id: 'live', label: 'Live' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'leaderboard', label: 'Ranks' },
  { id: 'achievements', label: 'Wins' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
]

export function TopNav() {
  const activeTab = useStore((s) => s.activeTab)
  const setTab = useStore((s) => s.setTab)
  const setSpotlight = useStore((s) => s.setSpotlight)
  const profileName = useStore((s) => s.profile.name)

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 glass-strong border-b border-border flex items-center px-4 sm:px-5 gap-3 sm:gap-4">
      {/* Logo */}
      <button
        onClick={() => setTab('home')}
        className="flex items-center gap-2.5 shrink-0 group"
        aria-label="Project Delta — Home"
      >
        <span className="grid place-items-center size-8 rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
          <Triangle className="size-4 fill-current" />
        </span>
        <span className="hidden sm:block font-semibold tracking-tight text-[15px]">
          Project <span className="text-primary">Delta</span>
        </span>
      </button>

      {/* Center nav */}
      <nav className="flex-1 flex items-center justify-center min-w-0">
        <div className="flex items-center gap-0.5 rounded-full bg-white/5 border border-border p-1 overflow-x-auto scroll-none max-w-full">
          {TABS.map((t) => {
            const on = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'relative rounded-full px-3 sm:px-3.5 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap',
                  on
                    ? 'text-cream-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {on && (
                  <motion.span
                    layoutId="nav-pill-active"
                    className="absolute inset-0 rounded-full bg-cream elev-1"
                    transition={navSpring}
                    style={{ zIndex: 0 }}
                    aria-hidden
                  />
                )}
                <span className="relative z-[1]">{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={() => setSpotlight(true)}
          className="hidden md:flex items-center gap-2 rounded-full bg-white/5 border border-border pl-3 pr-2 py-1.5 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          aria-label="Open search"
        >
          <Search className="size-3.5" />
          <span>Search</span>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
        </button>
        <button
          onClick={() => setSpotlight(true)}
          className="md:hidden grid place-items-center rounded-full size-9 bg-white/5 border border-border text-muted-foreground hover:text-foreground"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>
        <div className="relative">
          <IconButton label="Notifications">
            <Bell className="size-4" />
          </IconButton>
          <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />
        </div>
        <button onClick={() => setTab('profile')} aria-label="Open profile" className="rounded-full ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar name={profileName} size={36} />
        </button>
      </div>
    </header>
  )
}
