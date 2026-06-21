/**
 * Custom component templates — the schema layer.
 *
 * Each template defines:
 *  - id: unique identifier
 *  - name: display name
 *  - description: what it does
 *  - icon: lucide icon name
 *  - defaultProps: the initial props when a new instance is created
 *  - validate: optional validation function for the props
 *
 * The 8 templates cover the vast majority of "I want a X" requests:
 *  - List → TODO list, checklist, task list
 *  - Stat → streak counter, score display, any number+label
 *  - Counter → habit counter, rep counter, increment/decrement
 *  - Timer → Pomodoro, study timer, countdown
 *  - Note → sticky note, scratch pad, mantra
 *  - Links → bookmarks, resources, quick links
 *  - Progress → progress toward a goal (daily target, weekly hours)
 *  - Chart → simple bar/line chart for habit tracking
 *
 * The render components live in custom-component-renderers.tsx.
 */

export type TemplateId =
  | 'list'
  | 'stat'
  | 'counter'
  | 'timer'
  | 'note'
  | 'links'
  | 'progress'
  | 'chart'

export interface TemplateProp {
  key: string
  label: string
  type: 'string' | 'boolean' | 'number' | 'color' | 'select'
  options?: string[] // for select type
  default: unknown
}

export interface Template {
  id: TemplateId
  name: string
  description: string
  icon: string // lucide icon name
  defaultSize: { w: number; h: number }
  props: TemplateProp[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'list',
    name: 'List',
    description: 'A checkable list — TODO, checklist, task list',
    icon: 'ListTodo',
    defaultSize: { w: 280, h: 300 },
    props: [
      { key: 'title', label: 'Title', type: 'string', default: 'TODO' },
      { key: 'checkable', label: 'Checkable items', type: 'boolean', default: true },
      { key: 'allowAdd', label: 'Allow adding items', type: 'boolean', default: true },
      { key: 'allowRemove', label: 'Allow removing items', type: 'boolean', default: true },
    ],
  },
  {
    id: 'stat',
    name: 'Stat',
    description: 'A number + label — streak, score, counter display',
    icon: 'Hash',
    defaultSize: { w: 220, h: 140 },
    props: [
      { key: 'label', label: 'Label', type: 'string', default: 'Streak' },
      { key: 'value', label: 'Value', type: 'string', default: '0' },
      { key: 'sub', label: 'Subtitle', type: 'string', default: 'days' },
      { key: 'icon', label: 'Icon name', type: 'select', options: ['Flame', 'Trophy', 'Target', 'Zap', 'Star', 'Heart'], default: 'Flame' },
    ],
  },
  {
    id: 'counter',
    name: 'Counter',
    description: 'Increment/decrement counter — habit tracker, reps',
    icon: 'TallyCounter',
    defaultSize: { w: 200, h: 180 },
    props: [
      { key: 'label', label: 'Label', type: 'string', default: 'Push-ups' },
      { key: 'step', label: 'Step', type: 'number', default: 1 },
      { key: 'start', label: 'Start value', type: 'number', default: 0 },
    ],
  },
  {
    id: 'timer',
    name: 'Timer',
    description: 'Countdown timer — Pomodoro, study session',
    icon: 'Timer',
    defaultSize: { w: 220, h: 200 },
    props: [
      { key: 'label', label: 'Label', type: 'string', default: 'Focus' },
      { key: 'minutes', label: 'Minutes', type: 'number', default: 25 },
    ],
  },
  {
    id: 'note',
    name: 'Note',
    description: 'Sticky note — scratch pad, reminder, mantra',
    icon: 'StickyNote',
    defaultSize: { w: 240, h: 200 },
    props: [
      { key: 'title', label: 'Title', type: 'string', default: 'Note' },
      { key: 'placeholder', label: 'Placeholder', type: 'string', default: 'Write something…' },
    ],
  },
  {
    id: 'links',
    name: 'Links',
    description: 'Bookmark list — resources, quick links',
    icon: 'Link',
    defaultSize: { w: 240, h: 260 },
    props: [
      { key: 'title', label: 'Title', type: 'string', default: 'Bookmarks' },
    ],
  },
  {
    id: 'progress',
    name: 'Progress',
    description: 'Progress bar toward a goal — daily target, weekly hours',
    icon: 'TrendingUp',
    defaultSize: { w: 240, h: 160 },
    props: [
      { key: 'label', label: 'Label', type: 'string', default: 'Daily goal' },
      { key: 'current', label: 'Current', type: 'number', default: 3 },
      { key: 'target', label: 'Target', type: 'number', default: 8 },
      { key: 'unit', label: 'Unit', type: 'string', default: 'hrs' },
    ],
  },
  {
    id: 'chart',
    name: 'Chart',
    description: 'Simple bar chart — habit grid, weekly tracking',
    icon: 'BarChart3',
    defaultSize: { w: 300, h: 220 },
    props: [
      { key: 'label', label: 'Label', type: 'string', default: 'This week' },
      { key: 'days', label: 'Days', type: 'number', default: 7 },
    ],
  },
]

/** Get a template by id. */
export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

/** Build the default props object for a template. */
export function getDefaultProps(template: Template): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  template.props.forEach((p) => {
    props[p.key] = p.default
  })
  return props
}
