import type { ActionId, GameState, Goal, SkillKey, StatKey, Week } from '../types/game'
import { SKILL_LABEL, STAT_LABEL } from './balance'
import { Rng } from '../utils/random'
import { toCgpa } from './scoring'

const STAT_GOALS: Array<{ key: StatKey; step: number; max: number }> = [
  { key: 'dsa', step: 6, max: 96 }, { key: 'projects', step: 8, max: 96 }, { key: 'interview', step: 8, max: 96 },
  { key: 'resume', step: 10, max: 96 }, { key: 'networking', step: 8, max: 96 }, { key: 'wellbeing', step: 10, max: 95 }, { key: 'cgpa', step: 3, max: 98 },
]
const DAY_GOALS: Array<{ key: ActionId; n: number; label: (n: number) => string }> = [
  { key: 'dsa', n: 4, label: (n) => `Practise DSA on ${n} days` },
  { key: 'study', n: 3, label: (n) => `Study on ${n} days` },
  { key: 'sleep', n: 4, label: (n) => `Sleep properly on ${n} nights` },
  { key: 'chill', n: 2, label: (n) => `Go out ${n} times` },
  { key: 'mock', n: 2, label: (n) => `Do ${n} mock interviews` },
  { key: 'project', n: 3, label: (n) => `Work on the project ${n} days` },
  { key: 'college', n: 3, label: (n) => `Attend class ${n} times` },
]
const SKILLS: SkillKey[] = ['arrays', 'graphs', 'dp', 'system']

function statLabel(key: StatKey, target: number) {
  return key === 'cgpa' ? `Reach CGPA ${toCgpa(target).toFixed(1)}` : `Reach ${STAT_LABEL[key]} ${target}`
}

/** Three goals for the week starting on `day`, chosen from the player's current state. */
export function makeWeek(state: GameState, day: number, rng: Rng): Week {
  const goals: Goal[] = []
  const used = new Set<string>()
  const pick = <T,>(arr: T[]) => arr[rng.int(0, arr.length - 1)]

  // 1. a stat push
  const s = pick(STAT_GOALS.filter((g) => state.stats[g.key] < g.max))
  if (s) {
    const target = Math.min(s.max, Math.ceil((state.stats[s.key] + s.step) / (s.key === 'cgpa' ? 1 : 5)) * (s.key === 'cgpa' ? 1 : 5))
    goals.push({ id: `stat-${s.key}`, kind: 'stat', key: s.key, target, progress: 0, done: false, label: statLabel(s.key, target) })
    used.add(s.key)
  }
  // 2. a habit
  const d = pick(DAY_GOALS.filter((g) => !used.has(g.key)))
  goals.push({ id: `days-${d.key}`, kind: 'days', key: d.key, target: d.n, progress: 0, done: false, label: d.label(d.n) })
  // 3. companies if they are around, otherwise a specific skill
  if (day >= 20 && rng.chance(0.6)) {
    const n = day >= 40 ? 2 : 1
    goals.push({ id: 'apply', kind: 'apply', key: 'apply', target: n, progress: 0, done: false, label: `Apply to ${n} compan${n === 1 ? 'y' : 'ies'}` })
  } else {
    const weakest = [...SKILLS].sort((a, b) => state.skills[a] - state.skills[b])[0]
    const target = Math.min(95, Math.ceil((state.skills[weakest] + 8) / 5) * 5)
    goals.push({ id: `skill-${weakest}`, kind: 'skill', key: weakest, target, progress: 0, done: false, label: `Get ${SKILL_LABEL[weakest]} to ${target}` })
  }
  return { start: day, goals, days: {}, applied: 0, cleared: false, celebrated: false }
}

/** Recompute goal progress from state. Pure. */
export function evaluateWeek(state: GameState): Week {
  const w = state.week
  const goals = w.goals.map((g) => {
    let progress = 0
    if (g.kind === 'stat') progress = state.stats[g.key as StatKey]
    else if (g.kind === 'skill') progress = state.skills[g.key as SkillKey]
    else if (g.kind === 'days') progress = (w.days[g.key as ActionId] ?? 0) + ((state.usedToday[g.key as ActionId] ?? 0) > 0 ? 1 : 0)
    else if (g.kind === 'apply') progress = w.applied
    return { ...g, progress, done: g.done || progress >= g.target }
  })
  return { ...w, goals }
}
