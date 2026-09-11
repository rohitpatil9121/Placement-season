import type {
  ActionId,
  AllStatKey,
  Counters,
  Effects,
  GameEvent,
  GameState,
  GameStats,
  LogEntry,
  Rarity,
} from '../types/game'
import { ACTION_MAP } from '../data/actions'
import { EVENTS, RARITY_WEIGHTS } from '../data/events'
import { ACHIEVEMENTS } from '../data/achievements'
import { ACTIONS_PER_DAY, TOTAL_DAYS, getPhase } from '../data/phases'
import { Rng, randomSeed } from './random'
import { buildPlacementResult, clamp, computeCareer, fromCgpa } from './scoring'

export const SAVE_VERSION = 3

export const STAT_META: Record<
  AllStatKey,
  { label: string; emoji: string; hidden?: boolean }
> = {
  energy: { label: 'Energy', emoji: '⚡' },
  dsa: { label: 'DSA', emoji: '🧠' },
  sleep: { label: 'Sleep', emoji: '😴' },
  cgpa: { label: 'CGPA', emoji: '📚' },
  wellbeing: { label: 'Wellbeing', emoji: '❤️' },
  career: { label: 'Career', emoji: '💼' },
  projects: { label: 'Projects', emoji: '💻', hidden: true },
  resume: { label: 'Resume', emoji: '📄', hidden: true },
  interview: { label: 'Interview', emoji: '🎤', hidden: true },
  applications: { label: 'Applications', emoji: '📨', hidden: true },
  networking: { label: 'Networking', emoji: '🤝', hidden: true },
  luck: { label: 'Luck', emoji: '🍀', hidden: true },
  motivation: { label: 'Motivation', emoji: '🔥', hidden: true },
  attendance: { label: 'Attendance', emoji: '🏫', hidden: true },
}

export const PRIMARY_STATS: AllStatKey[] = ['energy', 'dsa', 'sleep', 'cgpa', 'wellbeing', 'career']

const TIMES = ['09:30 AM', '12:30 PM', '04:00 PM', '07:30 PM', '10:00 PM', '11:59 PM']

export function initialStats(): GameStats {
  const stats: GameStats = {
    energy: 80,
    dsa: 30,
    sleep: 65,
    cgpa: fromCgpa(7.8),
    wellbeing: 70,
    career: 0,
    projects: 10,
    resume: 15,
    interview: 10,
    applications: 0,
    networking: 10,
    luck: 10,
    motivation: 50,
    attendance: 40,
  }
  stats.career = computeCareer(stats, 0)
  return stats
}

export function initialCounters(): Counters {
  return {
    coffees: 0,
    dsaProblems: 0,
    applicationsSent: 0,
    breakdowns: 0,
    referrals: 0,
    linkedinEvents: 0,
    offers: 0,
    firstOfferDay: null,
    lowSleepDays: 0,
    sleepTotal: 0,
    highWellbeingDays: 0,
    mocksDone: 0,
    projectsBuilt: 0,
    chillDays: 0,
    vivas: 0,
    rejections: 0,
    daysAtZeroEnergy: 0,
    careerBonus: 0,
    eventsSeen: 0,
    actionsTaken: 0,
  }
}

export function createInitialState(seed = randomSeed()): GameState {
  return {
    version: SAVE_VERSION,
    seed,
    rngState: seed,
    status: 'playing',
    day: 1,
    actionsLeft: ACTIONS_PER_DAY,
    stats: initialStats(),
    counters: initialCounters(),
    actionsUsedToday: {},
    log: [
      {
        id: 1,
        day: 1,
        time: '08:00 AM',
        text: 'Day 1. 90 days to placement. Your CGPA is 7.8 and your confidence is unearned.',
        emoji: '🎬',
        kind: 'system',
      },
    ],
    achievements: [],
    eventHistory: [],
    pendingEvent: null,
    finalResult: null,
    lastLogId: 1,
    startedAt: Date.now(),
  }
}

/* ------------------------------------------------------------------ */
/* Effects                                                             */
/* ------------------------------------------------------------------ */

/** Apply effects with clamping. Returns the new stats and the *actual* deltas. */
export function applyEffects(stats: GameStats, effects: Effects, bonus: number): { stats: GameStats; deltas: Effects } {
  const next: GameStats = { ...stats }
  const deltas: Effects = {}
  for (const [k, v] of Object.entries(effects) as [AllStatKey, number][]) {
    if (!v) continue
    if (k === 'career') {
      // direct career effects are stored as a bonus that feeds the computed score
      continue
    }
    const before = next[k]
    next[k] = clamp(before + v)
    const d = Math.round((next[k] - before) * 100) / 100
    if (d !== 0) deltas[k] = d
  }
  const careerBefore = stats.career
  next.career = computeCareer(next, bonus + (effects.career ?? 0))
  const cd = next.career - careerBefore
  if (cd !== 0) deltas.career = cd
  return { stats: next, deltas }
}

function pushLog(state: GameState, entry: Omit<LogEntry, 'id' | 'day'>): GameState {
  const id = state.lastLogId + 1
  const log = [...state.log, { ...entry, id, day: state.day }]
  return { ...state, log: log.length > 400 ? log.slice(-400) : log, lastLogId: id }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type ActionResult = {
  state: GameState
  deltas: Effects
  flavor: string
  ok: boolean
  reason?: string
}

export function canPerformAction(state: GameState, actionId: ActionId): { ok: boolean; reason?: string } {
  const action = ACTION_MAP[actionId]
  if (!action) return { ok: false, reason: 'Unknown action.' }
  if (state.status !== 'playing') return { ok: false, reason: 'Game is not running.' }
  if (state.pendingEvent) return { ok: false, reason: 'Resolve the event first.' }
  if (state.day >= TOTAL_DAYS) return { ok: false, reason: 'It is placement day.' }
  if (action.cost > state.actionsLeft) {
    return { ok: false, reason: action.cost === 0 ? '' : 'Not enough actions left today.' }
  }
  const used = state.actionsUsedToday[actionId] ?? 0
  if (action.maxPerDay !== undefined && used >= action.maxPerDay) {
    return { ok: false, reason: `Max ${action.maxPerDay}× per day.` }
  }
  const exhausting = ['grind_dsa', 'study', 'project', 'mock', 'college'] as ActionId[]
  if (state.stats.energy <= 0 && exhausting.includes(actionId)) {
    return { ok: false, reason: 'Zero energy. Bro, please sleep.' }
  }
  return { ok: true }
}

/** Compute the dynamic effects of an action for the current state. */
export function resolveActionEffects(state: GameState, actionId: ActionId, rng: Rng): Effects {
  const action = ACTION_MAP[actionId]
  const s = state.stats
  const e: Effects = { ...action.effects }
  const sleepMod = s.sleep < 30 ? 0.65 : s.sleep < 50 ? 0.85 : s.sleep > 80 ? 1.1 : 1
  const energyMod = s.energy <= 0 ? 0.4 : s.energy < 20 ? 0.7 : 1
  const moodMod = s.wellbeing < 25 ? 0.8 : s.wellbeing > 85 ? 1.08 : 1
  const motMod = 0.9 + s.motivation / 500 // 0.9 – 1.1

  switch (actionId) {
    case 'grind_dsa': {
      const base = rng.int(4, 8)
      const tier = s.dsa < 30 ? 1.15 : s.dsa < 60 ? 1 : s.dsa < 80 ? 0.65 : 0.4
      e.dsa = Math.max(1, Math.round(base * tier * sleepMod * energyMod * moodMod * motMod * 10) / 10)
      e.wellbeing = rng.int(-4, -2)
      break
    }
    case 'study': {
      e.cgpa = Math.round(rng.int(10, 24) / 10 * sleepMod * energyMod * 10) / 10 // ≈ +0.05 to +0.12 CGPA
      break
    }
    case 'project': {
      e.projects = Math.round(5 * energyMod * motMod * 10) / 10
      break
    }
    case 'mock': {
      e.interview = Math.round(5 * sleepMod * moodMod * 10) / 10
      break
    }
    case 'apply': {
      const quality = 0.6 + s.resume / 150 // 0.6 – 1.27
      e.applications = Math.round(3 * quality * 10) / 10
      break
    }
    case 'network': {
      e.networking = Math.round(5 * moodMod * 10) / 10
      break
    }
    case 'deep_sleep': {
      if (s.sleep > 85) e.sleep = 8
      break
    }
    case 'chill': {
      if (s.wellbeing > 90) e.wellbeing = 5
      break
    }
    default:
      break
  }
  return e
}

const ACTION_SIDE_LOGS: Partial<Record<ActionId, { chance: number; text: string; emoji: string; effects: Effects; counter?: keyof Counters }>> = {
  mock: {
    chance: 0.25,
    text: 'Got absolutely destroyed by the interviewer. "What is a closure?" You closed the tab.',
    emoji: '💥',
    effects: { wellbeing: -3, interview: 1, motivation: 3 },
  },
  college: {
    chance: 0.2,
    text: 'Surprise viva in class. You answered "yes sir" to a question that was not yes/no.',
    emoji: '🚨',
    effects: { cgpa: -0.5, wellbeing: -3 },
    counter: 'vivas',
  },
  network: {
    chance: 0.1,
    text: 'A senior actually replied with a referral link. Screenshot sent to the group.',
    emoji: '🤝',
    effects: { applications: 3, luck: 2 },
    counter: 'referrals',
  },
  linkedin: {
    chance: 0.35,
    text: 'You saw someone from your school become a Senior Software Engineer at 21.',
    emoji: '📱',
    effects: { wellbeing: -3, motivation: 3 },
    counter: 'linkedinEvents',
  },
}

export function performAction(state: GameState, actionId: ActionId): ActionResult {
  const check = canPerformAction(state, actionId)
  if (!check.ok) return { state, deltas: {}, flavor: '', ok: false, reason: check.reason }

  const action = ACTION_MAP[actionId]
  const rng = new Rng(state.rngState)
  const effects = resolveActionEffects(state, actionId, rng)
  const { stats, deltas } = applyEffects(state.stats, effects, state.counters.careerBonus)

  const counters: Counters = { ...state.counters, actionsTaken: state.counters.actionsTaken + 1 }
  counters.careerBonus += effects.career ?? 0
  if (actionId === 'coffee') counters.coffees += 1
  if (actionId === 'grind_dsa') counters.dsaProblems += rng.int(2, 6)
  if (actionId === 'apply') counters.applicationsSent += Math.round(effects.applications ?? 3)
  if (actionId === 'mock') counters.mocksDone += 1
  if (actionId === 'project') counters.projectsBuilt += 1
  if (actionId === 'chill') counters.chillDays += 1
  if (actionId === 'linkedin') counters.linkedinEvents += 1

  const timeIdx = Math.min(TIMES.length - 1, ACTIONS_PER_DAY - state.actionsLeft + (actionId === 'coffee' ? 3 : 0))
  const flavor = rng.pick(action.flavor)

  let next: GameState = {
    ...state,
    stats,
    counters,
    actionsLeft: state.actionsLeft - action.cost,
    actionsUsedToday: { ...state.actionsUsedToday, [actionId]: (state.actionsUsedToday[actionId] ?? 0) + 1 },
  }
  next = pushLog(next, { time: TIMES[timeIdx], text: `${action.name} — ${flavor}`, emoji: action.emoji, kind: 'action' })

  // small inline side-effects (viva, destroyed in mock, LinkedIn pain)
  const side = ACTION_SIDE_LOGS[actionId]
  let sideDeltas: Effects = {}
  if (side && rng.chance(side.chance)) {
    const applied = applyEffects(next.stats, side.effects, next.counters.careerBonus)
    sideDeltas = applied.deltas
    const c = { ...next.counters }
    if (side.counter) (c[side.counter] as number) += 1
    next = pushLog({ ...next, stats: applied.stats, counters: c }, { time: TIMES[timeIdx], text: side.text, emoji: side.emoji, kind: 'event' })
  }

  if (next.stats.energy <= 0 && state.stats.energy > 0) {
    next = { ...next, counters: { ...next.counters, daysAtZeroEnergy: next.counters.daysAtZeroEnergy + 1 } }
    next = pushLog(next, { time: TIMES[timeIdx], text: 'Energy hit zero. Bro, please sleep.', emoji: '🪫', kind: 'system' })
  }

  // random event after an action (about half the phase's daily chance)
  const phase = getPhase(next.day)
  let chance = phase.eventChance * 0.45
  if (next.stats.energy <= 0) chance += 0.15
  if (next.stats.wellbeing < 25) chance += 0.1
  if (actionId !== 'coffee' && rng.chance(chance)) {
    const ev = rollEvent(next, rng)
    if (ev) next = { ...next, pendingEvent: { event: ev } }
  }

  next = { ...next, rngState: rng.state }
  const merged = mergeDeltas(deltas, sideDeltas)
  return { state: next, deltas: merged, flavor, ok: true }
}

export function mergeDeltas(a: Effects, b: Effects): Effects {
  const out: Effects = { ...a }
  for (const [k, v] of Object.entries(b) as [AllStatKey, number][]) {
    out[k] = Math.round(((out[k] ?? 0) + v) * 100) / 100
    if (out[k] === 0) delete out[k]
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

function eventEligible(ev: GameEvent, state: GameState): boolean {
  const c = ev.condition
  if (c) {
    if (c.minDay !== undefined && state.day < c.minDay) return false
    if (c.maxDay !== undefined && state.day > c.maxDay) return false
    if (c.minStat) {
      for (const [k, v] of Object.entries(c.minStat) as [AllStatKey, number][]) if (state.stats[k] < v) return false
    }
    if (c.maxStat) {
      for (const [k, v] of Object.entries(c.maxStat) as [AllStatKey, number][]) if (state.stats[k] > v) return false
    }
  }
  const recent = state.eventHistory.slice(-6)
  if (recent.includes(ev.id)) return false
  if (ev.tags?.includes('offer') && state.eventHistory.filter((id) => id === ev.id).length >= 2) return false
  return true
}

export function rollEvent(state: GameState, rng: Rng): GameEvent | null {
  const phase = getPhase(state.day)
  const intensity = phase.id === 'prep' ? 0 : phase.id === 'grind' ? 0.35 : phase.id === 'placement' ? 0.7 : 1
  const rarityBoost: Record<Rarity, number> = {
    common: 1 - intensity * 0.35,
    uncommon: 1,
    rare: 1 + intensity * 0.6,
    epic: 1 + intensity * 0.9,
    legendary: 1 + intensity * 1.2 + state.stats.luck / 100,
  }
  const eligible = EVENTS.filter((e) => eventEligible(e, state))
  const weights = eligible.map((e) => {
    let w = RARITY_WEIGHTS[e.rarity] * rarityBoost[e.rarity] * (e.weight ?? 1)
    if (e.tags?.includes('placement') && intensity > 0) w *= 1 + intensity
    if (e.tags?.includes('linkedin') && state.stats.wellbeing < 40) w *= 1.4
    if (e.tags?.includes('breakdown') && state.stats.wellbeing < 30) w *= 1.5
    return w
  })
  return rng.weighted(eligible, weights)
}

export type EventResolution = { state: GameState; deltas: Effects; resultText: string }

export function resolveEvent(state: GameState, choiceIndex?: number): EventResolution {
  const pending = state.pendingEvent
  if (!pending) return { state, deltas: {}, resultText: '' }
  const ev = pending.event
  let effects: Effects = {}
  let resultText = ''
  if (ev.choices && ev.choices.length) {
    const idx = Math.min(ev.choices.length - 1, Math.max(0, choiceIndex ?? 0))
    effects = ev.choices[idx].effects
    resultText = ev.choices[idx].result
  } else {
    effects = { ...(ev.effects ?? {}) }
    if (ev.conditional) {
      const branch = state.stats[ev.conditional.key] >= ev.conditional.threshold ? ev.conditional.above : ev.conditional.below
      effects = mergeDeltas(effects, branch)
    }
  }

  const bonus = state.counters.careerBonus + (effects.career ?? 0)
  const { stats, deltas } = applyEffects(state.stats, effects, bonus)
  const counters: Counters = { ...state.counters, careerBonus: bonus, eventsSeen: state.counters.eventsSeen + 1 }
  if (ev.tags?.includes('linkedin')) counters.linkedinEvents += 1
  if (ev.tags?.includes('referral')) counters.referrals += 1
  if (ev.tags?.includes('rejection')) counters.rejections += 1
  if (ev.tags?.includes('breakdown') || ev.id === 'surprise_viva') counters.breakdowns += 1
  if (ev.id === 'surprise_viva') counters.vivas += 1
  if (ev.tags?.includes('offer')) {
    counters.offers += 1
    if (counters.firstOfferDay === null) counters.firstOfferDay = state.day
  }

  let next: GameState = {
    ...state,
    stats,
    counters,
    pendingEvent: null,
    eventHistory: [...state.eventHistory, ev.id].slice(-200),
  }
  next = pushLog(next, {
    time: TIMES[Math.min(TIMES.length - 1, ACTIONS_PER_DAY - state.actionsLeft + 1)],
    text: `${ev.title}${resultText ? ` — ${resultText}` : ''}`,
    emoji: ev.emoji,
    kind: 'event',
  })
  return { state: next, deltas, resultText }
}

/* ------------------------------------------------------------------ */
/* Day progression                                                     */
/* ------------------------------------------------------------------ */

export type EndDayResult = { state: GameState; deltas: Effects; finished: boolean }

export function endDay(state: GameState): EndDayResult {
  if (state.status !== 'playing' || state.pendingEvent) return { state, deltas: {}, finished: false }
  const rng = new Rng(state.rngState)
  const s = state.stats

  // overnight recovery — depends on sleep quality
  const sleepQ = s.sleep / 100
  const recovery: Effects = {
    energy: Math.round(8 + 22 * sleepQ),
    sleep: state.actionsUsedToday.deep_sleep ? 0 : Math.round(-6 + (s.sleep > 60 ? -2 : 0)),
    wellbeing: s.sleep < 30 ? -4 : s.sleep > 70 ? 2 : 0,
    motivation: -1,
  }
  if (s.energy <= 0) recovery.wellbeing = (recovery.wellbeing ?? 0) - 3
  if (s.wellbeing <= 0) {
    recovery.energy = (recovery.energy ?? 0) - 8
    recovery.dsa = -1
  }
  if (s.sleep <= 0) {
    recovery.energy = Math.round((recovery.energy ?? 0) * 0.4)
    recovery.cgpa = -0.5
  }
  // low motivation slowly drags DSA memory
  if (s.motivation < 15) recovery.dsa = (recovery.dsa ?? 0) - 1

  const { stats, deltas } = applyEffects(s, recovery, state.counters.careerBonus)

  const counters: Counters = { ...state.counters }
  counters.sleepTotal += stats.sleep
  if (stats.sleep < 20) counters.lowSleepDays += 1
  if (stats.wellbeing > 90) counters.highWellbeingDays += 1
  else counters.highWellbeingDays = 0

  const newDay = state.day + 1
  let next: GameState = {
    ...state,
    stats,
    counters,
    day: newDay,
    actionsLeft: ACTIONS_PER_DAY,
    actionsUsedToday: {},
  }

  if (newDay >= TOTAL_DAYS) {
    const finalResult = buildPlacementResult(stats, counters.careerBonus, state.seed)
    next = { ...next, day: TOTAL_DAYS, status: 'finished', finalResult, rngState: rng.state }
    next = pushLog(next, { time: '09:00 AM', text: 'PLACEMENT DAY. After 90 days of chaos, it is time.', emoji: '🎓', kind: 'system' })
    return { state: next, deltas, finished: true }
  }

  const phase = getPhase(newDay)
  const prevPhase = getPhase(state.day)
  next = pushLog(next, {
    time: '08:00 AM',
    text: rng.pick(MORNING_LINES(newDay, stats)),
    emoji: '🌅',
    kind: 'system',
  })
  if (phase.id !== prevPhase.id) {
    next = pushLog(next, { time: '08:01 AM', text: `${phase.emoji} ${phase.name} begins. ${phase.tagline}`, emoji: phase.emoji, kind: 'system' })
  }

  // morning event
  let chance = phase.eventChance
  if (stats.energy <= 5) chance += 0.15
  if (rng.chance(chance)) {
    const ev = rollEvent(next, rng)
    if (ev) next = { ...next, pendingEvent: { event: ev } }
  }

  return { state: { ...next, rngState: rng.state }, deltas, finished: false }
}

const MORNING_LINES = (day: number, s: GameStats): string[] => {
  const left = TOTAL_DAYS - day
  const lines = [
    `Day ${day}. ${left} days to placement. Alarm snoozed ${Math.min(9, Math.ceil((100 - s.sleep) / 12))} times.`,
    `Day ${day}. Woke up, checked the placement group, regretted it.`,
    `Day ${day}. ${left} days left. The countdown is not a suggestion.`,
    `Day ${day}. CGPA is temporary. Placement memes are forever.`,
    `Day ${day}. New day, same LeetCode tab open since last week.`,
  ]
  if (s.energy < 25) lines.push(`Day ${day}. Body: tired. Mind: tired. Coffee: mandatory.`)
  if (s.wellbeing > 80) lines.push(`Day ${day}. You feel good. Suspiciously good. Something will go wrong.`)
  if (left <= 9) lines.push(`Day ${day}. ${left} days left. Panic is now a scheduled activity.`)
  return lines
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export function checkAchievements(state: GameState): { state: GameState; unlocked: string[] } {
  const unlocked: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.includes(a.id)) continue
    let ok = false
    try {
      ok = a.check(state)
    } catch {
      ok = false
    }
    if (ok) unlocked.push(a.id)
  }
  if (!unlocked.length) return { state, unlocked }
  let next: GameState = { ...state, achievements: [...state.achievements, ...unlocked] }
  for (const id of unlocked) {
    const a = ACHIEVEMENTS.find((x) => x.id === id)!
    next = pushLog(next, { time: '—', text: `Achievement unlocked: ${a.name}`, emoji: a.emoji, kind: 'achievement' })
  }
  return { state: next, unlocked }
}

/** Sanitize any state so no stat can be out of range (defensive, used after load). */
export function sanitizeState(state: GameState): GameState {
  const stats = { ...state.stats }
  for (const k of Object.keys(stats) as AllStatKey[]) stats[k] = clamp(Number(stats[k]) || 0)
  stats.career = computeCareer(stats, state.counters.careerBonus ?? 0)
  return {
    ...state,
    stats,
    counters: { ...initialCounters(), ...state.counters },
    actionsLeft: clamp(state.actionsLeft, 0, ACTIONS_PER_DAY),
    day: clamp(state.day, 1, TOTAL_DAYS),
  }
}
