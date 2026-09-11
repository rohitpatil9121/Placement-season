import type { Phase, Stats, StatKey } from '../types/game'

export const TOTAL_DAYS = 90
/** No daily cap: energy is the budget. Kept as a large number so the cost bookkeeping still works. */
export const ACTIONS_PER_DAY = 99
export const SAVE_VERSION = 5
export const STREAK_BONUS_AT = 3

export const PHASES: Phase[] = [
  { id: 'prep', name: 'Preparation', from: 1, to: 30, copy: "There's still time.", eventChance: 0.26 },
  { id: 'grind', name: 'Grind', from: 31, to: 60, copy: 'Okay. This is getting real.', eventChance: 0.36 },
  { id: 'season', name: 'Interviews', from: 61, to: 80, copy: 'Companies are coming.', eventChance: 0.46 },
  { id: 'final', name: 'Final Week', from: 81, to: 89, copy: 'Whatever you know, you know.', eventChance: 0.58 },
  { id: 'day90', name: 'Placement Day', from: 90, to: 90, copy: "Let's see what happened.", eventChance: 0 },
]

export function getPhase(day: number): Phase {
  return PHASES.find((p) => day >= p.from && day <= p.to) ?? PHASES[PHASES.length - 1]
}

/** 0 in prep → 1 in the final week. Drives event intensity and rarity. */
export function intensity(day: number): number {
  const p = getPhase(day)
  return p.id === 'prep' ? 0 : p.id === 'grind' ? 0.35 : p.id === 'season' ? 0.7 : 1
}

export const STAT_LABEL: Record<StatKey, string> = {
  energy: 'Energy',
  sleep: 'Sleep',
  dsa: 'DSA',
  cgpa: 'CGPA',
  wellbeing: 'Wellbeing',
  projects: 'Projects',
  resume: 'Resume',
  interview: 'Interview',
  networking: 'Networking',
  applications: 'Applications',
  luck: 'Luck',
  motivation: 'Motivation',
}

export const CORE_KEYS: StatKey[] = ['energy', 'sleep', 'dsa', 'cgpa', 'wellbeing']
export const PROGRESS_KEYS: StatKey[] = ['projects', 'resume', 'interview', 'networking', 'applications']
export const SKILL_KEYS: StatKey[] = ['dsa', 'projects', 'interview', 'resume', 'networking']

export const INITIAL_STATS: Stats = {
  energy: 78,
  sleep: 65,
  dsa: 30,
  cgpa: 56, // 7.8
  wellbeing: 70,
  projects: 12,
  resume: 18,
  interview: 12,
  networking: 10,
  applications: 0,
  luck: 12,
  motivation: 55,
}

/** Diminishing returns for skills. The higher a skill, the harder it is to push. */
export function skillTier(value: number): number {
  if (value < 30) return 1
  if (value < 50) return 0.6
  if (value < 70) return 0.35
  if (value < 85) return 0.14
  return 0.06
}

export function cgpaTier(value: number): number {
  if (value < 70) return 1
  if (value < 85) return 0.5
  return 0.25
}

export const RARITY_WEIGHTS = { common: 55, uncommon: 25, rare: 12, epic: 6, legendary: 2 } as const

/** Overnight recovery. Sleep quality drives everything. */
export function overnight(stats: Stats, sleptToday: boolean, practicedDsa: boolean, studied: boolean) {
  const q = stats.sleep / 100
  const r: Partial<Record<StatKey, number>> = {
    energy: Math.round(6 + 14 * q),
    sleep: sleptToday ? -3 : -8,
    wellbeing: stats.sleep < 30 ? -4 : stats.sleep > 70 ? 2 : 0,
    motivation: -1,
  }
  if (stats.energy <= 0) r.wellbeing = (r.wellbeing ?? 0) - 3
  if (stats.wellbeing <= 0) {
    r.energy = (r.energy ?? 0) - 8
    r.dsa = -1
  }
  if (stats.sleep <= 0) {
    r.energy = Math.round((r.energy ?? 0) * 0.4)
    r.cgpa = -0.5
  }
  if (!practicedDsa && stats.dsa > 30) r.dsa = (r.dsa ?? 0) - Math.round((0.3 + stats.dsa / 100) * 10) / 10
  if (!studied && stats.cgpa > 40) r.cgpa = (r.cgpa ?? 0) - 0.22
  if (stats.motivation < 15) r.dsa = (r.dsa ?? 0) - 1
  return r
}

/** Probability of clearing an online assessment. */
export function oaPassChance(stats: Stats, test: 'dsa' | 'projects' | 'aptitude', tier: number): number {
  const base = test === 'dsa' ? stats.dsa : test === 'projects' ? (stats.projects * 0.7 + stats.resume * 0.3) : (stats.cgpa * 0.5 + stats.dsa * 0.3 + stats.wellbeing * 0.2)
  const p = 0.15 + (base / 100) * 0.8 + stats.luck / 400 - (tier - 1) * 0.12 - (stats.energy < 15 ? 0.1 : 0)
  return Math.max(0.05, Math.min(0.95, p))
}

/** Interview pass threshold out of 6 (3 questions × 2), softened by skill. */
export function interviewPasses(score: number, stats: Stats, tier: number, roll: number): boolean {
  const skill = stats.interview / 100
  const value = score / 6 + skill * 0.35 + (stats.wellbeing < 25 ? -0.1 : 0) + roll * 0.15
  const need = 0.55 + (tier - 1) * 0.12
  return value >= need
}
