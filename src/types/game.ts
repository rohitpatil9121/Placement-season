export type StatKey =
  | 'energy'
  | 'dsa'
  | 'sleep'
  | 'cgpa'
  | 'wellbeing'
  | 'career'

export type HiddenKey =
  | 'projects'
  | 'resume'
  | 'interview'
  | 'applications'
  | 'networking'
  | 'luck'
  | 'motivation'
  | 'attendance'

export type AllStatKey = StatKey | HiddenKey

/** All values are stored 0–100. CGPA is displayed as 5.0–10.0. */
export type GameStats = Record<AllStatKey, number>

export type Effects = Partial<Record<AllStatKey, number>>

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type Phase = {
  id: 'prep' | 'grind' | 'placement' | 'boss' | 'day90'
  name: string
  emoji: string
  from: number
  to: number
  glow: string
  eventChance: number
  tagline: string
}

export type ActionId =
  | 'grind_dsa'
  | 'deep_sleep'
  | 'study'
  | 'project'
  | 'mock'
  | 'apply'
  | 'resume'
  | 'network'
  | 'chill'
  | 'college'
  | 'linkedin'
  | 'coffee'
  | 'recover'

export type Action = {
  id: ActionId
  name: string
  description: string
  emoji: string
  cost: number
  /** static, base effects (dynamic parts live in gameLogic) */
  effects: Effects
  maxPerDay?: number
  tag: 'career' | 'academics' | 'rest' | 'social' | 'chaos'
  flavor: string[]
}

export type EventChoice = {
  label: string
  effects: Effects
  result: string
}

export type EventCondition = {
  minDay?: number
  maxDay?: number
  minStat?: Partial<Record<AllStatKey, number>>
  maxStat?: Partial<Record<AllStatKey, number>>
}

export type GameEvent = {
  id: string
  title: string
  description: string
  emoji: string
  rarity: Rarity
  effects?: Effects
  /** effects applied only when the condition matches */
  conditional?: { key: AllStatKey; threshold: number; above: Effects; below: Effects }
  choices?: EventChoice[]
  condition?: EventCondition
  tags?: Array<'linkedin' | 'referral' | 'offer' | 'placement' | 'rejection' | 'breakdown'>
  weight?: number
}

export type LogEntry = {
  id: number
  day: number
  time: string
  text: string
  emoji: string
  kind: 'action' | 'event' | 'system' | 'achievement'
}

export type ResolvedEvent = {
  event: GameEvent
  /** effects actually applied (if no choices) */
  applied?: Effects
}

export type Counters = {
  coffees: number
  dsaProblems: number
  applicationsSent: number
  breakdowns: number
  referrals: number
  linkedinEvents: number
  offers: number
  firstOfferDay: number | null
  lowSleepDays: number
  sleepTotal: number
  highWellbeingDays: number
  mocksDone: number
  projectsBuilt: number
  chillDays: number
  vivas: number
  rejections: number
  daysAtZeroEnergy: number
}

export type FloatingDelta = { id: number; key: AllStatKey; delta: number }

export type Settings = {
  sound: boolean
  music: boolean
  reducedMotion: boolean
  tutorialDone: boolean
}

export type Outcome = {
  min: number
  max: number
  title: string
  subtitle: string
  emoji: string
  salaryRange: [number, number]
  color: string
  role: string
}

export type PlacementResult = {
  score: number
  outcome: Outcome
  salaryLpa: number
  company: string
  role: string
}

export type GameStatus = 'start' | 'tutorial' | 'playing' | 'finished'

export type GameState = {
  version: number
  seed: number
  rngState: number
  status: GameStatus
  day: number
  actionsLeft: number
  stats: GameStats
  counters: Counters
  actionsUsedToday: Partial<Record<ActionId, number>>
  log: LogEntry[]
  achievements: string[]
  eventHistory: string[]
  pendingEvent: ResolvedEvent | null
  finalResult: PlacementResult | null
  lastLogId: number
  startedAt: number
}

export type Achievement = {
  id: string
  name: string
  description: string
  emoji: string
  check: (state: GameState) => boolean
  secret?: boolean
}
