import type { PhaseId, StatKey } from '../types/game'

/** One hue per stat, used everywhere that stat appears. */
export const STAT_COLOR: Record<StatKey, string> = {
  energy: '#FFB020',
  sleep: '#6C7BFF',
  dsa: '#8B5CF6',
  cgpa: '#3DBE7A',
  wellbeing: '#FF6B8A',
  projects: '#22B8CF',
  resume: '#22B8CF',
  interview: '#22B8CF',
  networking: '#22B8CF',
  applications: '#22B8CF',
  luck: '#22B8CF',
  motivation: '#22B8CF',
}

export const GOLD = '#F5C542'

export type PhaseTheme = { tint: string; tintDark: string; accent: string; ink: string }

export const PHASE_THEME: Record<PhaseId, PhaseTheme> = {
  prep: { tint: '#BDEDD6', tintDark: '#101A18', accent: '#2FBF9A', ink: '#0F5E4A' },
  grind: { tint: '#FFDDA6', tintDark: '#1C1710', accent: '#F59E0B', ink: '#7A4B05' },
  season: { tint: '#C7D7FF', tintDark: '#10142A', accent: '#3B82F6', ink: '#1E3A8A' },
  final: { tint: '#FFC4CE', tintDark: '#231115', accent: '#F43F5E', ink: '#881337' },
  day90: { tint: '#FFE38A', tintDark: '#221C0E', accent: '#F5C542', ink: '#7A5A00' },
}

/** Action → the stat colour used for its icon badge. */
export const ACTION_COLOR: Record<string, string> = {
  dsa: STAT_COLOR.dsa,
  study: STAT_COLOR.cgpa,
  project: STAT_COLOR.projects,
  sleep: STAT_COLOR.sleep,
  mock: STAT_COLOR.interview,
  resume: STAT_COLOR.resume,
  network: STAT_COLOR.networking,
  chill: STAT_COLOR.wellbeing,
  college: STAT_COLOR.cgpa,
  apply: STAT_COLOR.applications,
  coffee: STAT_COLOR.energy,
  rest: STAT_COLOR.wellbeing,
}

/** Outcome tier → full-bleed verdict colour. */
export function outcomeColor(score: number): { bg: string; fg: string } {
  if (score >= 96) return { bg: '#F5C542', fg: '#3B2A00' }
  if (score >= 86) return { bg: '#FF8A5B', fg: '#3F1600' }
  if (score >= 71) return { bg: '#8B5CF6', fg: '#FFFFFF' }
  if (score >= 56) return { bg: '#22B8CF', fg: '#04262B' }
  if (score >= 41) return { bg: '#3DBE7A', fg: '#062A18' }
  if (score >= 26) return { bg: '#FFB020', fg: '#3A2600' }
  return { bg: '#6B7A99', fg: '#FFFFFF' }
}

export const TIER_COLOR: Record<1 | 2 | 3, string> = { 1: '#3DBE7A', 2: '#22B8CF', 3: GOLD }

/** Hex → rgba string with alpha. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
