export type CoreKey = 'energy' | 'sleep' | 'dsa' | 'cgpa' | 'wellbeing'
export type ProgressKey = 'projects' | 'resume' | 'interview' | 'networking' | 'applications' | 'luck' | 'motivation'
export type StatKey = CoreKey | ProgressKey

/** Every stat is stored 0–100. CGPA is displayed as 5.0–10.0. */
export type Stats = Record<StatKey, number>
export type Effects = Partial<Record<StatKey, number>>

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type PhaseId = 'prep' | 'grind' | 'season' | 'final' | 'day90'
export type Phase = {
  id: PhaseId
  name: string
  from: number
  to: number
  copy: string
  eventChance: number
}

export type ActionId =
  | 'dsa'
  | 'study'
  | 'project'
  | 'sleep'
  | 'mock'
  | 'resume'
  | 'network'
  | 'chill'
  | 'college'
  | 'apply'
  | 'coffee'
  | 'rest'

export type Action = {
  id: ActionId
  name: string
  description: string
  icon: string
  cost: number
  maxPerDay?: number
  effects: Effects
  /** shown after the action; picked at random */
  lines: string[]
  /** progress keys this action reveals in the state panel */
  reveals?: ProgressKey[]
}

export type EventChoice = {
  label: string
  effects: Effects
  line: string
}

export type EventCondition = {
  minDay?: number
  maxDay?: number
  min?: Partial<Stats>
  max?: Partial<Stats>
}

export type GameEvent = {
  id: string
  title: string
  body: string
  /** optional quoted line rendered in serif */
  quote?: string
  rarity: Rarity
  effects?: Effects
  conditional?: { key: StatKey; threshold: number; above: Effects; below: Effects }
  choices?: EventChoice[]
  condition?: EventCondition
  tags?: Array<'linkedin' | 'referral' | 'rejection' | 'breakdown' | 'opportunity' | 'negative' | 'positive'>
  reveals?: ProgressKey[]
}

export type CompanyTest = 'dsa' | 'projects' | 'aptitude'

export type Company = {
  id: string
  name: string
  role: string
  packageLpa: number
  tagline: string
  eligibility: Partial<Record<'cgpa' | 'dsa' | 'projects' | 'resume', number>>
  test: CompanyTest
  appearsFrom: number
  appearsTo: number
  /** 1 = service company, 3 = dream company */
  tier: 1 | 2 | 3
}

export type ApplicationStage = 'discovered' | 'applied' | 'oa' | 'shortlisted' | 'interview' | 'offer' | 'rejected'

export type Application = {
  companyId: string
  stage: ApplicationStage
  discoveredDay: number
  updatedDay: number
  /** day the next pipeline step fires */
  nextDay?: number
  note?: string
}

export type InterviewOption = { label: string; score: 0 | 1 | 2; reply: string }
export type InterviewQuestion = { id: string; prompt: string; options: InterviewOption[] }

export type InterviewSession = {
  companyId: string
  questionIds: string[]
  index: number
  score: number
  lastReply: string | null
  /** set when finished */
  outcome: 'offer' | 'rejected' | null
}

export type LogEntry = {
  id: number
  day: number
  time: string
  text: string
  kind: 'action' | 'event' | 'system' | 'company' | 'achievement'
}

export type Metrics = {
  coffees: number
  problemsSolved: number
  applicationsSent: number
  interviewsAttended: number
  referrals: number
  sleepSacrificed: number
  hoursStudied: number
  projectsCompleted: number
  rejections: number
  offers: number
  breakdowns: number
  linkedinEvents: number
  firstOfferDay: number | null
  lowSleepDays: number
  highWellbeingDays: number
  balancedDays: number
  sleepTotal: number
  zeroEnergyHits: number
  careerBonus: number
  eventsSeen: number
}

export type DaySummary = {
  day: number
  deltas: Effects
  events: number
  /** streak names that ended today */
  lostStreaks: StreakKey[]
}

/** Compact record of one finished day, for the calendar. */
export type DayRecord = {
  day: number
  actions: Partial<Record<ActionId, number>>
  deltas: Effects
  events: string[]
  offers: number
  cgpaAfter: number
}

export type StreakKey = 'dsa' | 'study' | 'sleep'
export type Streaks = Record<StreakKey, number>

export type Settings = {
  sound: boolean
  reducedMotion: boolean
  seenFirstDayHint: boolean
  dark: boolean
  music: boolean
}

export type Outcome = {
  min: number
  max: number
  title: string
  line: string
  salaryRange: [number, number]
  role: string
}

export type PlacementResult = {
  score: number
  outcome: Outcome
  placed: boolean
  salaryLpa: number
  company: string
  role: string
  viaOffer: boolean
}

export type GameStatus = 'playing' | 'dayEnd' | 'finished'

export type GameState = {
  version: number
  seed: number
  rngState: number
  status: GameStatus
  day: number
  actionsRemaining: number
  stats: Stats
  dayStartStats: Stats
  revealed: ProgressKey[]
  metrics: Metrics
  usedToday: Partial<Record<ActionId, number>>
  log: LogEntry[]
  achievements: string[]
  eventHistory: string[]
  activeEvent: GameEvent | null
  interview: InterviewSession | null
  applications: Application[]
  daySummary: DaySummary | null
  dayEventCount: number
  streaks: Streaks
  history: DayRecord[]
  result: PlacementResult | null
  lastLogId: number
  startedAt: number
}

export type Achievement = {
  id: string
  name: string
  description: string
  check: (state: GameState) => boolean
}

export type BestRuns = {
  bestScore: number
  bestSalary: number
  bestDsa: number
  bestCgpa: number
  mostChaotic: number
  runs: number
}
