import type {
  ActionId, Application, Company, DaySummary, Effects, GameEvent, GameState, InterviewSession, LogEntry, Metrics,
  ProgressKey, Rarity, StatKey, Stats, StreakKey, Streaks,
} from '../types/game'
import { ACTION_MAP } from './actions'
import { EVENTS } from './events'
import { COMPANIES, COMPANY_MAP, INTERVIEW_QUESTIONS } from './companies'
import { ACHIEVEMENTS } from './achievements'
import {
  ACTIONS_PER_DAY, CORE_KEYS, INITIAL_STATS, RARITY_WEIGHTS, SAVE_VERSION, SKILL_KEYS, STREAK_BONUS_AT, TOTAL_DAYS,
  cgpaTier, getPhase, intensity, interviewPasses, oaPassChance, overnight, skillTier,
} from './balance'
import { Rng, randomSeed } from '../utils/random'
import { buildResult, clamp, fromCgpa } from './scoring'

const TIMES = ['08:30', '09:30', '10:30', '11:30', '12:30', '14:00', '15:00', '16:00', '17:00', '18:30', '19:30', '21:00', '22:00', '23:00', '23:50']

/* ------------------------------------------------------------------ */
/* State construction                                                  */
/* ------------------------------------------------------------------ */

export function initialMetrics(): Metrics {
  return {
    coffees: 0, problemsSolved: 0, applicationsSent: 0, interviewsAttended: 0, referrals: 0, sleepSacrificed: 0,
    hoursStudied: 0, projectsCompleted: 0, rejections: 0, offers: 0, breakdowns: 0, linkedinEvents: 0,
    firstOfferDay: null, lowSleepDays: 0, highWellbeingDays: 0, balancedDays: 0, sleepTotal: 0, zeroEnergyHits: 0,
    careerBonus: 0, eventsSeen: 0,
  }
}

export function createGame(seed = randomSeed()): GameState {
  const stats = { ...INITIAL_STATS }
  return {
    version: SAVE_VERSION,
    seed,
    rngState: seed,
    status: 'playing',
    day: 1,
    actionsRemaining: ACTIONS_PER_DAY,
    stats,
    dayStartStats: { ...stats },
    revealed: [],
    metrics: initialMetrics(),
    usedToday: {},
    log: [{ id: 1, day: 1, time: '08:00', text: 'Ninety days to placement. CGPA 7.8. Confidence: unearned.', kind: 'system' }],
    achievements: [],
    eventHistory: [],
    activeEvent: null,
    interview: null,
    applications: [],
    daySummary: null,
    dayEventCount: 0,
    streaks: { dsa: 0, study: 0, sleep: 0 },
    result: null,
    lastLogId: 1,
    startedAt: Date.now(),
  }
}

/* ------------------------------------------------------------------ */
/* Effects                                                             */
/* ------------------------------------------------------------------ */

export function applyEffects(stats: Stats, effects: Effects): { stats: Stats; deltas: Effects } {
  const next: Stats = { ...stats }
  const deltas: Effects = {}
  for (const [k, raw] of Object.entries(effects) as [StatKey, number][]) {
    if (!raw) continue
    const before = next[k]
    let v = raw
    if (v > 0 && SKILL_KEYS.includes(k)) v = Math.max(0.2, Math.round(v * skillTier(before) * 10) / 10)
    if (v > 0 && k === 'cgpa') v = Math.max(0.2, Math.round(v * cgpaTier(before) * 10) / 10)
    next[k] = clamp(Math.round((before + v) * 100) / 100)
    const d = Math.round((next[k] - before) * 100) / 100
    if (d !== 0) deltas[k] = d
  }
  return { stats: next, deltas }
}

export function mergeEffects(a: Effects, b: Effects): Effects {
  const out: Effects = { ...a }
  for (const [k, v] of Object.entries(b) as [StatKey, number][]) {
    const n = Math.round(((out[k] ?? 0) + v) * 100) / 100
    if (n === 0) delete out[k]
    else out[k] = n
  }
  return out
}

function log(state: GameState, entry: Omit<LogEntry, 'id' | 'day'>): GameState {
  const id = state.lastLogId + 1
  const next = [...state.log, { ...entry, id, day: state.day }]
  return { ...state, log: next.length > 300 ? next.slice(-300) : next, lastLogId: id }
}

function reveal(state: GameState, keys?: ProgressKey[]): GameState {
  if (!keys?.length) return state
  const missing = keys.filter((k) => !state.revealed.includes(k))
  return missing.length ? { ...state, revealed: [...state.revealed, ...missing] } : state
}

const timeFor = (state: GameState, offset = 0) =>
  TIMES[Math.min(TIMES.length - 1, Object.values(state.usedToday).reduce((a, b) => a + (b ?? 0), 0) + offset)]

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export function canAct(state: GameState, id: ActionId): { ok: boolean; reason?: string } {
  const action = ACTION_MAP[id]
  if (!action) return { ok: false, reason: 'Unknown action.' }
  if (state.status !== 'playing') return { ok: false }
  if (state.activeEvent || state.interview) return { ok: false }
  const used = state.usedToday[id] ?? 0
  if (used >= (action.maxPerDay ?? 1)) return { ok: false, reason: 'Done for today' }
  return { ok: true }
}

/** Effects the player will see before committing. Deterministic preview (no randomness). */
export function previewAction(state: GameState, id: ActionId): Effects {
  const action = ACTION_MAP[id]
  const s = state.stats
  const e: Effects = { ...action.effects }
  const sleepMod = s.sleep < 30 ? 0.65 : s.sleep < 50 ? 0.85 : s.sleep > 80 ? 1.1 : 1
  const energyMod = 1
  const moodMod = s.wellbeing < 25 ? 0.8 : s.wellbeing > 85 ? 1.08 : 1
  const round = (v: number) => Math.round(v * 10) / 10
  switch (id) {
    case 'dsa':
      e.dsa = round(6 * sleepMod * energyMod * moodMod * skillTier(s.dsa))
      break
    case 'study':
      e.cgpa = round(1.7 * sleepMod * energyMod * cgpaTier(s.cgpa))
      break
    case 'project':
      e.projects = round(5 * energyMod * skillTier(s.projects))
      break
    case 'mock':
      e.interview = round(5 * sleepMod * energyMod * moodMod * skillTier(s.interview))
      break
    case 'resume':
      e.resume = round(7 * energyMod * skillTier(s.resume))
      break
    case 'network':
      e.networking = round(5 * energyMod * moodMod * skillTier(s.networking))
      break
    case 'apply':
      e.applications = round(3 * energyMod * (0.6 + s.resume / 150))
      break
    case 'sleep':
      if (s.sleep > 85) e.sleep = 8
      break
    case 'chill':
      if (s.wellbeing > 90) e.wellbeing = 5
      break
  }
  // preview shows post-tier numbers, so skip the tier again when applying
  return e
}

/** Convert a preview (already tier-adjusted) into raw effects that applyEffects can consume. */
function rawFromPreview(state: GameState, id: ActionId, preview: Effects, rng: Rng): Effects {
  const e: Effects = { ...preview }
  const s = state.stats
  const jitter = (v: number) => Math.round(v * (0.85 + rng.next() * 0.3) * 10) / 10
  for (const k of SKILL_KEYS) {
    if (e[k] && e[k]! > 0) e[k] = Math.max(0.2, jitter(e[k]!)) / skillTier(s[k])
  }
  if (e.cgpa && e.cgpa > 0) e.cgpa = jitter(e.cgpa) / cgpaTier(s.cgpa)
  if (id === 'dsa') e.wellbeing = rng.int(-4, -2)
  return e
}

const SIDE_EFFECTS: Partial<Record<ActionId, { chance: number; text: string; effects: Effects; metric?: keyof Metrics }>> = {
  mock: { chance: 0.25, text: 'Got taken apart in the mock. "What is a closure?" You closed the tab.', effects: { wellbeing: -3, interview: 1, motivation: 3 } },
  college: { chance: 0.2, text: 'Surprise viva in class. You said "yes sir" to a question that was not yes or no.', effects: { cgpa: -0.5, wellbeing: -3 }, metric: 'breakdowns' },
  network: { chance: 0.1, text: 'A senior actually sent a referral link. Screenshot sent to the group.', effects: { applications: 3, luck: 2 }, metric: 'referrals' },
}

export type ActionResult = { state: GameState; deltas: Effects; line: string; ok: boolean }

export function performAction(state: GameState, id: ActionId): ActionResult {
  if (!canAct(state, id).ok) return { state, deltas: {}, line: '', ok: false }
  const action = ACTION_MAP[id]
  const rng = new Rng(state.rngState)
  const preview = previewAction(state, id)
  const effects = rawFromPreview(state, id, preview, rng)
  const applied = applyEffects(state.stats, effects)

  const m: Metrics = { ...state.metrics }
  if (id === 'coffee') m.coffees += 1
  if (id === 'dsa') m.problemsSolved += rng.int(3, 7)
  if (id === 'study') m.hoursStudied += rng.int(2, 4)
  if (id === 'college') m.hoursStudied += 2
  if (id === 'apply') m.applicationsSent += Math.round(applied.deltas.applications ?? 3)
  if (id === 'project') m.projectsCompleted += rng.chance(0.3) ? 1 : 0

  const line = rng.pick(action.lines)
  let next: GameState = {
    ...state,
    stats: applied.stats,
    metrics: m,
    actionsRemaining: state.actionsRemaining - action.cost,
    usedToday: { ...state.usedToday, [id]: (state.usedToday[id] ?? 0) + 1 },
  }
  next = reveal(next, action.reveals)
  next = log(next, { time: timeFor(state, id === 'coffee' ? 3 : 0), text: `${action.name}. ${line}`, kind: 'action' })

  let deltas = applied.deltas
  const side = SIDE_EFFECTS[id]
  if (side && rng.chance(side.chance)) {
    const s2 = applyEffects(next.stats, side.effects)
    deltas = mergeEffects(deltas, s2.deltas)
    const m2 = { ...next.metrics }
    if (side.metric) (m2[side.metric] as number) += 1
    next = log({ ...next, stats: s2.stats, metrics: m2 }, { time: timeFor(state), text: side.text, kind: 'event' })
    if (side.metric === 'referrals') next = reveal(next, ['networking', 'applications'])
  }

  if (next.stats.energy <= 0 && state.stats.energy > 0) {
    next = log({ ...next, metrics: { ...next.metrics, zeroEnergyHits: next.metrics.zeroEnergyHits + 1 } }, { time: timeFor(state), text: 'Energy is gone. You should probably sleep.', kind: 'system' })
  }

  // an event may interrupt the day
  const phase = getPhase(next.day)
  let chance = phase.eventChance * 0.22
  if (next.stats.energy <= 0) chance += 0.12
  if (next.stats.wellbeing < 25) chance += 0.08
  if (next.dayEventCount >= 2) chance = 0
  if (id !== 'coffee' && rng.chance(chance)) {
    const ev = rollEvent(next, rng)
    if (ev) next = { ...next, activeEvent: ev, dayEventCount: next.dayEventCount + 1 }
  }

  return { state: { ...next, rngState: rng.state }, deltas, line, ok: true }
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

function eligible(ev: GameEvent, state: GameState): boolean {
  const c = ev.condition
  if (c) {
    if (c.minDay !== undefined && state.day < c.minDay) return false
    if (c.maxDay !== undefined && state.day > c.maxDay) return false
    if (c.min) for (const [k, v] of Object.entries(c.min) as [StatKey, number][]) if (state.stats[k] < v) return false
    if (c.max) for (const [k, v] of Object.entries(c.max) as [StatKey, number][]) if (state.stats[k] > v) return false
  }
  if (state.eventHistory.slice(-7).includes(ev.id)) return false
  return true
}

export function rollEvent(state: GameState, rng: Rng): GameEvent | null {
  const t = intensity(state.day)
  const s = state.stats
  const boost: Record<Rarity, number> = {
    common: 1 - t * 0.35,
    uncommon: 1,
    rare: 1 + t * 0.6,
    epic: 1 + t * 0.9,
    legendary: 1 + t * 1.2 + s.luck / 100,
  }
  const doingWell = s.wellbeing > 60 && s.energy > 40
  const struggling = s.wellbeing < 30 || s.energy < 15
  const pool = EVENTS.filter((e) => eligible(e, state))
  const weights = pool.map((e) => {
    let w = RARITY_WEIGHTS[e.rarity] * boost[e.rarity]
    // choices matter: strong networking → referrals; low wellbeing → linkedin/breakdowns; good state → recovery
    if (e.tags?.includes('referral')) w *= 0.6 + s.networking / 60
    if (e.tags?.includes('linkedin') && s.wellbeing < 40) w *= 1.4
    if (e.tags?.includes('breakdown') && s.wellbeing < 30) w *= 1.4
    if (e.tags?.includes('positive') && doingWell) w *= 1.25
    // anti-frustration: never pile on someone already down; toss the struggling player a rope
    if (e.tags?.includes('negative') && struggling) w *= 0.45
    if (e.tags?.includes('opportunity') && struggling && state.day > 30) w *= 1.6
    return w
  })
  return rng.weighted(pool, weights)
}

export type EventResolution = { state: GameState; deltas: Effects; line: string }

export function applyEvent(state: GameState, choiceIndex?: number): EventResolution {
  const ev = state.activeEvent
  if (!ev) return { state, deltas: {}, line: '' }
  let effects: Effects = {}
  let line = ''
  if (ev.choices?.length) {
    const idx = Math.min(ev.choices.length - 1, Math.max(0, choiceIndex ?? 0))
    effects = ev.choices[idx].effects
    line = ev.choices[idx].line
  } else {
    effects = { ...(ev.effects ?? {}) }
    if (ev.conditional) {
      const branch = state.stats[ev.conditional.key] >= ev.conditional.threshold ? ev.conditional.above : ev.conditional.below
      effects = mergeEffects(effects, branch)
    }
  }
  const applied = applyEffects(state.stats, effects)
  const m: Metrics = { ...state.metrics, eventsSeen: state.metrics.eventsSeen + 1 }
  if (ev.tags?.includes('linkedin')) m.linkedinEvents += 1
  if (ev.tags?.includes('referral') && (choiceIndex ?? 0) !== 2) m.referrals += 1
  if (ev.tags?.includes('rejection')) m.rejections += 1
  if (ev.tags?.includes('breakdown')) m.breakdowns += 1

  let next: GameState = {
    ...state,
    stats: applied.stats,
    metrics: m,
    activeEvent: null,
    eventHistory: [...state.eventHistory, ev.id].slice(-200),
  }
  next = reveal(next, ev.reveals)
  next = log(next, { time: timeFor(state, 1), text: `${ev.title}. ${line || summarize(applied.deltas)}`.trim(), kind: 'event' })
  return { state: next, deltas: applied.deltas, line }
}

function summarize(d: Effects): string {
  const parts = Object.entries(d).map(([k, v]) => `${v! > 0 ? '+' : ''}${k === 'cgpa' ? (v! / 20).toFixed(2) : Math.round(v!)} ${k}`)
  return parts.join(', ')
}

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

export function eligibilityGaps(company: Company, stats: Stats): string[] {
  const gaps: string[] = []
  const e = company.eligibility
  if (e.cgpa !== undefined && stats.cgpa < fromCgpa(e.cgpa)) gaps.push(`CGPA ${e.cgpa.toFixed(1)}+`)
  if (e.dsa !== undefined && stats.dsa < e.dsa) gaps.push(`DSA ${e.dsa}+`)
  if (e.projects !== undefined && stats.projects < e.projects) gaps.push(`Projects ${e.projects}+`)
  if (e.resume !== undefined && stats.resume < e.resume) gaps.push(`Resume ${e.resume}+`)
  return gaps
}

export function applyToCompany(state: GameState, companyId: string): GameState {
  const app = state.applications.find((a) => a.companyId === companyId)
  const company = COMPANY_MAP[companyId]
  if (!app || !company || app.stage !== 'discovered') return state
  if (eligibilityGaps(company, state.stats).length) return state
  const rng = new Rng(state.rngState)
  const nextDay = state.day + rng.int(1, 3)
  const applications = state.applications.map((a) =>
    a.companyId === companyId ? { ...a, stage: 'applied' as const, updatedDay: state.day, nextDay, note: `Online assessment on day ${nextDay}` } : a,
  )
  let next: GameState = {
    ...state,
    applications,
    rngState: rng.state,
    metrics: { ...state.metrics, applicationsSent: state.metrics.applicationsSent + 1 },
    stats: applyEffects(state.stats, { applications: 2, motivation: 2 }).stats,
  }
  next = reveal(next, ['applications'])
  return log(next, { time: timeFor(state), text: `Applied to ${company.name}. Online assessment in ${nextDay - state.day} day${nextDay - state.day === 1 ? '' : 's'}.`, kind: 'company' })
}

export function ignoreCompany(state: GameState, companyId: string): GameState {
  return { ...state, applications: state.applications.filter((a) => !(a.companyId === companyId && a.stage === 'discovered')) }
}

/** Morning: discover companies, run OAs, start interviews. */
function processCompanies(state: GameState, rng: Rng): GameState {
  let next = state
  const day = next.day
  // discovery
  const known = new Set(next.applications.map((a) => a.companyId))
  const candidates = COMPANIES.filter((c) => !known.has(c.id) && day >= c.appearsFrom && day <= c.appearsTo)
  const discoverChance = 0.22 + intensity(day) * 0.18 + next.stats.networking / 400
  if (candidates.length && rng.chance(discoverChance)) {
    const c = rng.pick(candidates)
    next = { ...next, applications: [...next.applications, { companyId: c.id, stage: 'discovered', discoveredDay: day, updatedDay: day }] }
    next = log(next, { time: '08:05', text: `${c.name} is hiring on campus. ${c.role}, ₹${c.packageLpa} LPA.`, kind: 'company' })
  }
  // pipeline steps
  for (const app of next.applications) {
    if (app.nextDay === undefined || app.nextDay > day) continue
    const c = COMPANY_MAP[app.companyId]
    if (app.stage === 'applied') {
      const pass = rng.chance(oaPassChance(next.stats, c.test, c.tier))
      if (pass) {
        const interviewDay = day + rng.int(1, 2)
        next = updateApp(next, app.companyId, { stage: 'shortlisted', updatedDay: day, nextDay: interviewDay, note: `Interview on day ${interviewDay}` })
        next = log(next, { time: '08:10', text: `Cleared the ${c.name} assessment. Interview in ${interviewDay - day} day${interviewDay - day === 1 ? '' : 's'}. You now have that long to remember everything you have ever learned.`, kind: 'company' })
        next = { ...next, stats: applyEffects(next.stats, { motivation: 5, wellbeing: 4 }).stats }
      } else {
        next = updateApp(next, app.companyId, { stage: 'rejected', updatedDay: day, nextDay: undefined, note: 'Did not clear the assessment' })
        next = { ...next, metrics: { ...next.metrics, rejections: next.metrics.rejections + 1 }, stats: applyEffects(next.stats, { wellbeing: -6, motivation: 2 }).stats }
        next = log(next, { time: '08:10', text: `${c.name}: not this one. Rejected after the assessment.`, kind: 'company' })
      }
    } else if (app.stage === 'shortlisted' && !next.interview) {
      const qs = shuffle(INTERVIEW_QUESTIONS.map((q) => q.id), rng).slice(0, 3)
      next = updateApp(next, app.companyId, { stage: 'interview', updatedDay: day, nextDay: undefined, note: 'Interview today' })
      next = { ...next, interview: { companyId: c.id, questionIds: qs, index: 0, score: 0, lastReply: null, outcome: null } }
      break // one interview per morning
    }
  }
  return next
}

function updateApp(state: GameState, companyId: string, patch: Partial<Application>): GameState {
  return { ...state, applications: state.applications.map((a) => (a.companyId === companyId ? { ...a, ...patch } : a)) }
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ------------------------------------------------------------------ */
/* Interviews                                                          */
/* ------------------------------------------------------------------ */

export function answerInterview(state: GameState, optionIndex: number): GameState {
  const iv = state.interview
  if (!iv || iv.outcome) return state
  const q = INTERVIEW_QUESTIONS.find((x) => x.id === iv.questionIds[iv.index])
  if (!q) return state
  const opt = q.options[Math.min(q.options.length - 1, Math.max(0, optionIndex))]
  const session: InterviewSession = { ...iv, score: iv.score + opt.score, lastReply: opt.reply }
  const last = iv.index >= iv.questionIds.length - 1
  if (!last) return { ...state, interview: { ...session, index: iv.index + 1 } }

  const rng = new Rng(state.rngState)
  const c = COMPANY_MAP[iv.companyId]
  const passed = interviewPasses(session.score, state.stats, c.tier, rng.next())
  let next: GameState = { ...state, rngState: rng.state, interview: { ...session, outcome: passed ? 'offer' : 'rejected' } }
  const m = { ...next.metrics, interviewsAttended: next.metrics.interviewsAttended + 1 }
  if (passed) {
    m.offers += 1
    if (m.firstOfferDay === null) m.firstOfferDay = state.day
    m.careerBonus += 6
    next = updateApp(next, c.id, { stage: 'offer', updatedDay: state.day, note: `Offer · ₹${c.packageLpa} LPA` })
    next = { ...next, stats: applyEffects(next.stats, { wellbeing: 18, motivation: 10, interview: 3 }).stats }
    next = log(next, { time: '11:30', text: `${c.name} made an offer. ${c.role}, ₹${c.packageLpa} LPA. You screenshot it. Sharma ji is informed.`, kind: 'company' })
  } else {
    m.rejections += 1
    next = updateApp(next, c.id, { stage: 'rejected', updatedDay: state.day, note: 'Rejected after interview' })
    next = { ...next, stats: applyEffects(next.stats, { wellbeing: -9, motivation: 3, interview: 2 }).stats }
    next = log(next, { time: '11:30', text: `${c.name} passed. Not this one.`, kind: 'company' })
  }
  return { ...next, metrics: m }
}

export function closeInterview(state: GameState): GameState {
  return { ...state, interview: null }
}

/* ------------------------------------------------------------------ */
/* Day progression                                                     */
/* ------------------------------------------------------------------ */

/** End the day: overnight recovery, summary. Status becomes 'dayEnd' (or 'finished' on day 90). */
export function endDay(state: GameState): GameState {
  if (state.status !== 'playing' || state.activeEvent || state.interview) return state
  const s = state.stats
  const recovery = overnight(s, !!state.usedToday.sleep, !!state.usedToday.dsa, !!(state.usedToday.study || state.usedToday.college))

  // streaks: consecutive days of the same habit; a small bonus once a streak is established
  const did: Record<StreakKey, boolean> = { dsa: !!state.usedToday.dsa, study: !!(state.usedToday.study || state.usedToday.college), sleep: !!state.usedToday.sleep }
  const streaks: Streaks = { ...state.streaks }
  const lostStreaks: StreakKey[] = []
  for (const k of Object.keys(did) as StreakKey[]) {
    if (did[k]) streaks[k] += 1
    else {
      if (streaks[k] >= STREAK_BONUS_AT) lostStreaks.push(k)
      streaks[k] = 0
    }
  }
  if (streaks.dsa >= STREAK_BONUS_AT) recovery.dsa = (recovery.dsa ?? 0) + 0.4
  if (streaks.study >= STREAK_BONUS_AT) recovery.cgpa = (recovery.cgpa ?? 0) + 0.15
  if (streaks.sleep >= STREAK_BONUS_AT) recovery.wellbeing = (recovery.wellbeing ?? 0) + 1
  const applied = applyEffects(s, recovery)

  const m: Metrics = { ...state.metrics }
  m.sleepTotal += applied.stats.sleep
  if (applied.stats.sleep < 20) m.lowSleepDays += 1
  if (applied.stats.sleep < 30) m.sleepSacrificed += 1
  m.highWellbeingDays = applied.stats.wellbeing > 90 ? m.highWellbeingDays + 1 : 0
  m.balancedDays = CORE_KEYS.every((k) => applied.stats[k] > 50) ? m.balancedDays + 1 : 0

  const deltas: Effects = {}
  for (const k of Object.keys(applied.stats) as StatKey[]) {
    const d = Math.round((applied.stats[k] - state.dayStartStats[k]) * 100) / 100
    if (d !== 0) deltas[k] = d
  }
  const summary: DaySummary = { day: state.day, deltas, events: state.dayEventCount, lostStreaks }
  const nextDay = state.day + 1

  if (nextDay >= TOTAL_DAYS) {
    const result = buildResult(applied.stats, m.careerBonus, state.applications, state.seed)
    let next: GameState = { ...state, stats: applied.stats, metrics: m, day: TOTAL_DAYS, status: 'finished', result, daySummary: summary, streaks }
    next = log(next, { time: '09:00', text: 'Placement day.', kind: 'system' })
    return next
  }
  return { ...state, stats: applied.stats, metrics: m, status: 'dayEnd', daySummary: summary, streaks }
}

/** Start the next day after the transition screen. */
export function startDay(state: GameState): GameState {
  if (state.status !== 'dayEnd') return state
  const rng = new Rng(state.rngState)
  const day = state.day + 1
  let next: GameState = {
    ...state,
    status: 'playing',
    day,
    actionsRemaining: ACTIONS_PER_DAY,
    usedToday: {},
    daySummary: null,
    dayEventCount: 0,
    dayStartStats: { ...state.stats },
  }
  next = log(next, { time: '08:00', text: rng.pick(morningLines(day, next.stats)), kind: 'system' })
  const phase = getPhase(day)
  if (phase.id !== getPhase(state.day).id) next = log(next, { time: '08:01', text: `${phase.name}. ${phase.copy}`, kind: 'system' })

  next = processCompanies(next, rng)

  if (!next.interview) {
    let chance = phase.eventChance * 0.8
    if (next.stats.energy <= 5) chance += 0.12
    if (rng.chance(chance)) {
      const ev = rollEvent(next, rng)
      if (ev) next = { ...next, activeEvent: ev, dayEventCount: 1 }
    }
  }
  return { ...next, rngState: rng.state }
}

const morningLines = (day: number, s: Stats): string[] => {
  const left = TOTAL_DAYS - day
  const lines = [
    `Day ${day}. ${left} days left.`,
    `Day ${day}. Checked the placement group. Regretted it.`,
    `Day ${day}. The LeetCode tab from last week is still open.`,
    `Day ${day}. ${left} days. The countdown is not a suggestion.`,
  ]
  if (s.energy < 25) lines.push(`Day ${day}. Body tired. Mind tired. Coffee mandatory.`)
  if (s.wellbeing > 80) lines.push(`Day ${day}. You feel good. Suspiciously good.`)
  if (left <= 9) lines.push(`Day ${day}. ${left} days. Panic is now scheduled.`)
  return lines
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export function unlockAchievements(state: GameState): { state: GameState; unlocked: string[] } {
  const unlocked = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && safe(() => a.check(state))).map((a) => a.id)
  if (!unlocked.length) return { state, unlocked }
  let next: GameState = { ...state, achievements: [...state.achievements, ...unlocked] }
  for (const id of unlocked) {
    const a = ACHIEVEMENTS.find((x) => x.id === id)!
    next = log(next, { time: '—', text: `${a.name}. ${a.description}`, kind: 'achievement' })
  }
  return { state: next, unlocked }
}

const safe = (fn: () => boolean) => {
  try {
    return fn()
  } catch {
    return false
  }
}

/** Defensive clamp after loading a save. */
export function sanitize(state: GameState): GameState {
  const stats = { ...INITIAL_STATS, ...state.stats }
  for (const k of Object.keys(stats) as StatKey[]) stats[k] = clamp(Number(stats[k]) || 0)
  return {
    ...state,
    stats,
    dayStartStats: state.dayStartStats ?? { ...stats },
    metrics: { ...initialMetrics(), ...state.metrics },
    revealed: Array.isArray(state.revealed) ? state.revealed : [],
    applications: Array.isArray(state.applications) ? state.applications : [],
    actionsRemaining: ACTIONS_PER_DAY,
    day: clamp(state.day, 1, TOTAL_DAYS),
    dayEventCount: state.dayEventCount ?? 0,
    streaks: { ...{ dsa: 0, study: 0, sleep: 0 }, ...(state.streaks ?? {}) },
    version: SAVE_VERSION,
  }
}
