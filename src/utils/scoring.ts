import type { GameStats, Outcome, PlacementResult } from '../types/game'
import { Rng } from './random'

export const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v))

/** internal 0–100 → 5.0–10.0 */
export const toCgpa = (v: number) => Math.round((5 + clamp(v) / 20) * 100) / 100
/** 5.0–10.0 → internal 0–100 */
export const fromCgpa = (c: number) => clamp((c - 5) * 20)

/** Career readiness shown on the dashboard. Formula is hidden from the player. */
export function computeCareer(stats: GameStats, bonus: number): number {
  const raw =
    stats.dsa * 0.3 +
    stats.projects * 0.2 +
    stats.resume * 0.15 +
    stats.interview * 0.15 +
    stats.networking * 0.1 +
    stats.applications * 0.05 +
    stats.cgpa * 0.05 +
    bonus
  return Math.round(clamp(raw))
}

export function computePlacementScore(stats: GameStats, careerBonus: number): number {
  const base =
    stats.dsa * 0.3 +
    stats.cgpa * 0.15 +
    stats.projects * 0.15 +
    stats.interview * 0.15 +
    stats.resume * 0.1 +
    stats.networking * 0.05 +
    stats.applications * 0.05 +
    stats.luck * 0.05
  // Wellbeing nudges the result: burned-out candidates bomb interviews.
  const wellbeingMod = (stats.wellbeing - 50) * 0.06
  const offerMod = Math.min(6, careerBonus * 0.3)
  return Math.round(clamp(base + wellbeingMod + offerMod))
}

export const OUTCOMES: Outcome[] = [
  {
    min: 0, max: 25, emoji: '😭',
    title: 'Placement Season Defeated You',
    subtitle: 'No offer this time. The off-campus arc awaits.',
    salaryRange: [0, 0], color: '#FB7185', role: 'Unemployed (Aspiring)',
  },
  {
    min: 26, max: 40, emoji: '😅',
    title: 'Almost There',
    subtitle: 'Off-campus grind begins. LinkedIn is now your home.',
    salaryRange: [3, 5], color: '#FBBF24', role: 'Trainee Engineer',
  },
  {
    min: 41, max: 55, emoji: '🙂',
    title: 'Decent Start',
    subtitle: 'You landed an entry-level role. Your parents told the relatives.',
    salaryRange: [5, 8], color: '#38BDF8', role: 'Associate Software Engineer',
  },
  {
    min: 56, max: 70, emoji: '🔥',
    title: 'Solid Placement',
    subtitle: 'You got a good software role. Sharma ji is quiet now.',
    salaryRange: [8, 12], color: '#7C5CFC', role: 'Software Engineer',
  },
  {
    min: 71, max: 85, emoji: '🚀',
    title: 'Cracked It',
    subtitle: 'An excellent offer. The placement group asked for your "tips".',
    salaryRange: [12, 18], color: '#4ADE80', role: 'Software Engineer I',
  },
  {
    min: 86, max: 95, emoji: '💰',
    title: 'PLACEMENT BEAST',
    subtitle: 'You absolutely destroyed placement season.',
    salaryRange: [18, 25], color: '#F472B6', role: 'SDE / Member of Technical Staff',
  },
  {
    min: 96, max: 100, emoji: '👑',
    title: 'CAMPUS LEGEND',
    subtitle: 'HR is asking YOU for referrals.',
    salaryRange: [25, 45], color: '#FBBF24', role: 'Software Engineer II (skipped a level)',
  },
]

const COMPANIES = [
  'TechCorp', 'DefinitelyNotGoogle', 'Startup With 14 Employees', 'Random Unicorn Pvt. Ltd.',
  "Your Friend's Company", 'Infinite Loop Systems', 'NullPointer Technologies', 'Chai & Code Labs',
  'Blockchain But For Samosas', 'Agile Waterfall Inc.', 'MegaSoft (Not That One)', 'Sharma Ji Ka Beta Ventures',
  'CloudNine Solutions (No Cloud)', 'Ctrl+Alt+Deliver', 'Bug Free Software Co. (Ironic)',
]

export function getOutcome(score: number): Outcome {
  return OUTCOMES.find((o) => score >= o.min && score <= o.max) ?? OUTCOMES[0]
}

export function buildPlacementResult(stats: GameStats, careerBonus: number, seed: number): PlacementResult {
  const score = computePlacementScore(stats, careerBonus)
  const outcome = getOutcome(score)
  const rng = new Rng(seed ^ 0x9e3779b9)
  const [lo, hi] = outcome.salaryRange
  let salaryLpa = 0
  if (hi > 0) {
    const t = (score - outcome.min) / Math.max(1, outcome.max - outcome.min)
    salaryLpa = Math.round((lo + (hi - lo) * t + rng.next() * 0.8) * 2) / 2
  }
  const company = hi === 0 ? 'Placement Portal (Closed)' : rng.pick(COMPANIES)
  return { score, outcome, salaryLpa, company, role: outcome.role }
}
