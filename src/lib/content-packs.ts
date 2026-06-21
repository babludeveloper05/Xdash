/**
 * Track-specific content packs.
 *
 * Each track defines a "flavor" of content — the chapter titles, video topic
 * fragments, test types, and instructor names that make the generated content
 * feel authentic for that field. This is what makes a Software Developer see
 * "Linked Lists" chapters and "Coding Interview" tests while a JEE aspirant
 * sees "Kinematics" chapters and "JEE Main" tests.
 *
 * The content generator (content-generator.ts) uses these templates to produce
 * chapters/videos/tests for whatever subjects the user picked during onboarding.
 */

export type ContentFlavor = 'academic' | 'professional' | 'creative' | 'language' | 'wellness'

interface TrackPack {
  /** The flavor determines chapter title style + test types + instructor names. */
  flavor: ContentFlavor
  /** Chapter title templates — {0} is replaced with a subject-appropriate topic. */
  chapterTopics: string[]
  /** Video topic fragments (per chapter). */
  videoTopics: string[]
  /** Test type labels. */
  testTypes: string[]
  /** Instructor name pool. */
  instructors: string[]
  /** Difficulty distribution. */
  difficulties: ('Easy' | 'Moderate' | 'Hard')[]
}

const ACADEMIC_PACK: TrackPack = {
  flavor: 'academic',
  chapterTopics: [
    'Fundamentals', 'Core Principles', 'Advanced Theory', 'Problem Solving',
    'Applications', 'Case Studies', 'Previous Year Questions', 'Quick Revision',
  ],
  videoTopics: [
    'Introduction & Fundamentals', 'Core Concepts', 'Solved Examples',
    'Advanced Problems', 'Quick Revision', 'Tricks & Shortcuts',
  ],
  testTypes: ['Full Syllabus', 'Chapter Test', 'Previous Year', 'Mock Test', 'Quiz'],
  instructors: ['NV Sir', 'AS Mam', 'GB Sir', 'MC Sir', 'RK Mam', 'JP Sir'],
  difficulties: ['Easy', 'Moderate', 'Hard', 'Moderate', 'Hard'],
}

const PROFESSIONAL_PACK: TrackPack = {
  flavor: 'professional',
  chapterTopics: [
    'Foundations', 'Core Patterns', 'Best Practices', 'Real-World Projects',
    'Advanced Techniques', 'Industry Standards', 'Interview Prep', 'Deep Dive',
  ],
  videoTopics: [
    'Getting Started', 'Core Concepts', 'Hands-on Demo',
    'Common Pitfalls', 'Pro Tips', 'Code Walkthrough',
  ],
  testTypes: ['Coding Challenge', 'Concept Quiz', 'Project Review', 'Mock Interview', 'Skill Test'],
  instructors: ['Alex Chen', 'Priya Patel', 'Marcus Webb', 'Sara Kim', 'David Luo', 'Maya Singh'],
  difficulties: ['Easy', 'Moderate', 'Hard', 'Moderate', 'Moderate'],
}

const CREATIVE_PACK: TrackPack = {
  flavor: 'creative',
  chapterTopics: [
    'Fundamentals', 'Design Principles', 'Techniques & Tools', 'Project Walkthrough',
    'Critique & Feedback', 'Portfolio Building', 'Advanced Concepts', 'Industry Insights',
  ],
  videoTopics: [
    'Introduction', 'Core Techniques', 'Step-by-Step Demo',
    'Common Mistakes', 'Pro Tips', 'Inspiration & References',
  ],
  testTypes: ['Design Brief', 'Concept Quiz', 'Portfolio Review', 'Peer Critique', 'Skill Challenge'],
  instructors: ['Lena Frost', 'Kai Rivera', 'Kai Mori', 'Zoe Park', 'Finn Adler', 'Iris Vale'],
  difficulties: ['Easy', 'Moderate', 'Moderate', 'Hard', 'Easy'],
}

const LANGUAGE_PACK: TrackPack = {
  flavor: 'language',
  chapterTopics: [
    'Essentials', 'Grammar Foundations', 'Vocabulary Building', 'Conversation Skills',
    'Reading Comprehension', 'Writing Practice', 'Advanced Fluency', 'Cultural Context',
  ],
  videoTopics: [
    'Introduction', 'Core Rules', 'Practice Exercises',
    'Common Mistakes', 'Pro Tips', 'Real Conversations',
  ],
  testTypes: ['Vocabulary Quiz', 'Grammar Test', 'Reading Comprehension', 'Listening Test', 'Speaking Practice'],
  instructors: ['Maria Lopez', 'Jean Dupont', 'Yuki Tanaka', 'Sofia Rossi', 'Hans Weber', 'Aria Khan'],
  difficulties: ['Easy', 'Moderate', 'Moderate', 'Hard', 'Easy'],
}

const WELLNESS_PACK: TrackPack = {
  flavor: 'wellness',
  chapterTopics: [
    'Getting Started', 'Foundations', 'Daily Practice', 'Building Habits',
    'Overcoming Challenges', 'Advanced Techniques', 'Mindset & Motivation', 'Long-term Success',
  ],
  videoTopics: [
    'Introduction', 'Core Principles', 'Guided Practice',
    'Common Questions', 'Pro Tips', 'Daily Routine',
  ],
  testTypes: ['Knowledge Check', 'Habit Tracker', 'Progress Review', 'Goal Setting', 'Self Assessment'],
  instructors: ['Coach Maya', 'Coach Ben', 'Coach Tara', 'Coach Ravi', 'Coach Emma', 'Coach Leo'],
  difficulties: ['Easy', 'Easy', 'Moderate', 'Moderate', 'Hard'],
}

/** Map track names to their content packs. Falls back to professional. */
const TRACK_PACKS: Record<string, TrackPack> = {
  // Students
  'JEE / Engineering': ACADEMIC_PACK,
  'NEET / Medical': ACADEMIC_PACK,
  'Board Exams': ACADEMIC_PACK,
  'UPSC / Civil Services': ACADEMIC_PACK,
  'GATE / Higher Studies': ACADEMIC_PACK,
  'Language / Aptitude': LANGUAGE_PACK,
  // Professionals
  'Software Developer': PROFESSIONAL_PACK,
  'Data / ML Engineer': PROFESSIONAL_PACK,
  'Product Manager': PROFESSIONAL_PACK,
  'Designer': CREATIVE_PACK,
  'Business / Finance': PROFESSIONAL_PACK,
  'Marketing / Growth': PROFESSIONAL_PACK,
  'DevOps / Cloud': PROFESSIONAL_PACK,
  // Personal growth
  'Language Learning': LANGUAGE_PACK,
  'Fitness & Health': WELLNESS_PACK,
  'Creative Writing': CREATIVE_PACK,
  'Music': CREATIVE_PACK,
  'General Knowledge': ACADEMIC_PACK,
}

/** Get the content pack for a track. Falls back to academic (general learning). */
export function getTrackPack(track: string): TrackPack {
  return TRACK_PACKS[track] ?? ACADEMIC_PACK
}

/** Get the flavor for a track. */
export function getTrackFlavor(track: string): ContentFlavor {
  return getTrackPack(track).flavor
}
