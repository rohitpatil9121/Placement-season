import type { Application, Outcome, PlacementResult, Stats } from '../types/game'
import { COMPANY_MAP, OFFCAMPUS_COMPANIES } from './companies'
import { Rng } from '../utils/random'

export const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v))
export const toCgpa = (v: number) => Math.round((5 + clamp(v) / 20) * 100) / 100
export const fromCgpa = (c: number) => clamp((c - 5) * 20)

/** Overall readiness; the formula is intentionally not surfaced in the UI. */
export function careerScore(stats: Stats, bonus: number): number {
  return Math.round(
    clamp(
      stats.dsa * 0.3 + stats.projects * 0.2 + stats.resume * 0.15 + stats.interview * 0.15 +
        stats.networking * 0.1 + stats.applications * 0.05 + stats.cgpa * 0.05 + bonus,
    ),
  )
}

export function placementScore(stats: Stats, careerBonus: number): number {
  const base =
    stats.dsa * 0.3 + stats.cgpa * 0.15 + stats.projects * 0.15 + stats.interview * 0.15 +
    stats.resume * 0.1 + stats.networking * 0.05 + stats.applications * 0.05 + stats.luck * 0.05
  const wellbeing = (stats.wellbeing - 50) * 0.06
  const offers = Math.min(6, careerBonus * 0.3)
  return Math.round(clamp(base + wellbeing + offers))
}

export const OUTCOMES: Outcome[] = [
  { min: 0, max: 25, title: 'Not placed', line: 'No offer this time. The off-campus arc begins.', salaryRange: [0, 0], role: '' },
  { min: 26, max: 40, title: 'Almost there', line: 'Off-campus grind. LinkedIn is home now.', salaryRange: [3, 5], role: 'Trainee Engineer' },
  { min: 41, max: 55, title: 'Decent start', line: 'An entry-level role. Your parents told the relatives.', salaryRange: [5, 8], role: 'Associate Software Engineer' },
  { min: 56, max: 70, title: 'Solid placement', line: 'A good software role. Sharma ji is quiet now.', salaryRange: [8, 12], role: 'Software Engineer' },
  { min: 71, max: 85, title: 'Cracked it', line: 'An excellent offer. The group chat wants your "tips".', salaryRange: [12, 18], role: 'Software Engineer I' },
  { min: 86, max: 95, title: 'Exceptional', line: 'You did not survive placement season. You ran it.', salaryRange: [18, 25], role: 'SDE / Member of Technical Staff' },
  { min: 96, max: 100, title: 'Campus legend', line: 'HR is asking you for referrals.', salaryRange: [25, 45], role: 'Software Engineer II' },
]

export const outcomeFor = (score: number) => OUTCOMES.find((o) => score >= o.min && score <= o.max) ?? OUTCOMES[0]

export function buildResult(stats: Stats, careerBonus: number, applications: Application[], seed: number): PlacementResult {
  const score = placementScore(stats, careerBonus)
  const rng = new Rng(seed ^ 0x9e3779b9)
  const offers = applications.filter((a) => a.stage === 'offer').map((a) => COMPANY_MAP[a.companyId]).filter(Boolean)
  const best = offers.sort((a, b) => b.packageLpa - a.packageLpa)[0]

  let outcome = outcomeFor(score)
  if (best) {
    // an on-campus offer guarantees placement; the tier reflects the better of score and package
    const byPackage = OUTCOMES.find((o) => best.packageLpa >= o.salaryRange[0] && best.packageLpa <= o.salaryRange[1] && o.salaryRange[1] > 0) ?? OUTCOMES[2]
    if (byPackage.min > outcome.min) outcome = byPackage
    if (outcome.min < 41) outcome = OUTCOMES[2]
    return { score, outcome, placed: true, salaryLpa: best.packageLpa, company: best.name, role: best.role, viaOffer: true }
  }

  const [lo, hi] = outcome.salaryRange
  if (hi === 0) return { score, outcome, placed: false, salaryLpa: 0, company: '', role: '', viaOffer: false }
  const t = (score - outcome.min) / Math.max(1, outcome.max - outcome.min)
  const salaryLpa = Math.round((lo + (hi - lo) * t + rng.next() * 0.8) * 2) / 2
  return { score, outcome, placed: true, salaryLpa, company: rng.pick(OFFCAMPUS_COMPANIES), role: outcome.role, viaOffer: false }
}
