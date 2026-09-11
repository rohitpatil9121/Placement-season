import type { GameState, Settings } from '../types/game'
import { SAVE_VERSION } from './gameLogic'

export const SAVE_KEY = 'placement-season:save'
export const SETTINGS_KEY = 'placement-season:settings'
export const LEADERBOARD_KEY = 'placement-season:leaderboard'
export const ACHIEVEMENTS_KEY = 'placement-season:achievements'

export type LeaderboardEntry = {
  id: string
  date: number
  score: number
  salaryLpa: number
  title: string
  emoji: string
  company: string
  dsa: number
  cgpa: number
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: false,
  reducedMotion: false,
  tutorialDone: false,
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode / quota) — game keeps running in memory */
  }
}

function safeRemove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Validate a parsed save. Returns null when the structure is not trustworthy. */
export function validateSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<GameState>
  if (s.version !== SAVE_VERSION) return null
  if (!isNum(s.day) || s.day < 1 || s.day > 90) return null
  if (!isNum(s.actionsLeft) || s.actionsLeft < 0 || s.actionsLeft > 3) return null
  if (!s.stats || typeof s.stats !== 'object') return null
  const requiredStats = [
    'energy', 'dsa', 'sleep', 'cgpa', 'wellbeing', 'career',
    'projects', 'resume', 'interview', 'applications', 'networking', 'luck', 'motivation', 'attendance',
  ] as const
  for (const k of requiredStats) {
    const v = (s.stats as Record<string, unknown>)[k]
    if (!isNum(v) || v < 0 || v > 100) return null
  }
  if (!s.counters || typeof s.counters !== 'object') return null
  if (!Array.isArray(s.log) || !Array.isArray(s.achievements) || !Array.isArray(s.eventHistory)) return null
  if (!['start', 'tutorial', 'playing', 'finished'].includes(String(s.status))) return null
  if (!isNum(s.seed) || !isNum(s.rngState)) return null
  return s as GameState
}

export type LoadResult = { state: GameState | null; corrupted: boolean }

export function loadGame(): LoadResult {
  const raw = safeGet(SAVE_KEY)
  if (!raw) return { state: null, corrupted: false }
  try {
    const parsed: unknown = JSON.parse(raw)
    const state = validateSave(parsed)
    if (!state) {
      safeRemove(SAVE_KEY)
      return { state: null, corrupted: true }
    }
    return { state, corrupted: false }
  } catch {
    safeRemove(SAVE_KEY)
    return { state: null, corrupted: true }
  }
}

export function saveGame(state: GameState) {
  safeSet(SAVE_KEY, JSON.stringify(state))
}

export function clearSave() {
  safeRemove(SAVE_KEY)
}

export function loadSettings(): Settings {
  const raw = safeGet(SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
      music: typeof parsed.music === 'boolean' ? parsed.music : DEFAULT_SETTINGS.music,
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
      tutorialDone: typeof parsed.tutorialDone === 'boolean' ? parsed.tutorialDone : DEFAULT_SETTINGS.tutorialDone,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings) {
  safeSet(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadLeaderboard(): LeaderboardEntry[] {
  const raw = safeGet(LEADERBOARD_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is LeaderboardEntry =>
        !!e && typeof e === 'object' && isNum((e as LeaderboardEntry).score) && typeof (e as LeaderboardEntry).title === 'string',
    )
  } catch {
    return []
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry) {
  const list = [...loadLeaderboard(), entry].sort((a, b) => b.score - a.score).slice(0, 10)
  safeSet(LEADERBOARD_KEY, JSON.stringify(list))
  return list
}

/** Achievements unlocked across all runs. */
export function loadGlobalAchievements(): string[] {
  const raw = safeGet(ACHIEVEMENTS_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveGlobalAchievements(ids: string[]) {
  safeSet(ACHIEVEMENTS_KEY, JSON.stringify(Array.from(new Set(ids))))
}

export function clearAllData() {
  safeRemove(SAVE_KEY)
  safeRemove(LEADERBOARD_KEY)
  safeRemove(ACHIEVEMENTS_KEY)
}
