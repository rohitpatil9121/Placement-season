import type { BestRuns, GameState, Settings } from '../types/game'
import { SAVE_VERSION } from '../game/balance'

const SAVE_KEY = 'placement-season:save'
const SETTINGS_KEY = 'placement-season:settings'
const BEST_KEY = 'placement-season:best'
const ACH_KEY = 'placement-season:achievements'

export const DEFAULT_SETTINGS: Settings = { sound: false, reducedMotion: false, seenFirstDayHint: false, dark: false }
export const EMPTY_BEST: BestRuns = { bestScore: 0, bestSalary: 0, bestDsa: 0, bestCgpa: 0, mostChaotic: 0, runs: 0 }

const get = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* storage unavailable: keep playing in memory */
  }
}
const remove = (k: string) => {
  try {
    localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function validate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<GameState>
  if (s.version !== SAVE_VERSION) return null
  if (!num(s.day) || s.day < 1 || s.day > 90) return null
  if (!num(s.actionsRemaining) || s.actionsRemaining < 0 || s.actionsRemaining > 3) return null
  if (!s.stats || typeof s.stats !== 'object') return null
  for (const k of ['energy', 'sleep', 'dsa', 'cgpa', 'wellbeing']) {
    const v = (s.stats as Record<string, unknown>)[k]
    if (!num(v) || v < 0 || v > 100) return null
  }
  if (!s.metrics || typeof s.metrics !== 'object') return null
  if (!Array.isArray(s.log) || !Array.isArray(s.achievements) || !Array.isArray(s.eventHistory)) return null
  if (!['playing', 'dayEnd', 'finished'].includes(String(s.status))) return null
  if (!num(s.seed) || !num(s.rngState)) return null
  return s as GameState
}

export function loadGame(): { state: GameState | null; corrupted: boolean } {
  const raw = get(SAVE_KEY)
  if (!raw) return { state: null, corrupted: false }
  try {
    const state = validate(JSON.parse(raw))
    if (!state) {
      console.warn('[placement-season] save failed validation; discarding')
      remove(SAVE_KEY)
      return { state: null, corrupted: true }
    }
    return { state, corrupted: false }
  } catch (err) {
    console.warn('[placement-season] save unreadable; discarding', err)
    remove(SAVE_KEY)
    return { state: null, corrupted: true }
  }
}

export const saveGame = (s: GameState) => set(SAVE_KEY, JSON.stringify(s))
export const clearSave = () => remove(SAVE_KEY)

export function loadSettings(): Settings {
  const raw = get(SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    const p = JSON.parse(raw) as Partial<Settings>
    return {
      sound: typeof p.sound === 'boolean' ? p.sound : DEFAULT_SETTINGS.sound,
      reducedMotion: typeof p.reducedMotion === 'boolean' ? p.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
      seenFirstDayHint: typeof p.seenFirstDayHint === 'boolean' ? p.seenFirstDayHint : false,
      dark: typeof p.dark === 'boolean' ? p.dark : false,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}
export const saveSettings = (s: Settings) => set(SETTINGS_KEY, JSON.stringify(s))

export function loadBest(): BestRuns {
  const raw = get(BEST_KEY)
  if (!raw) return EMPTY_BEST
  try {
    const p = JSON.parse(raw) as Partial<BestRuns>
    const out = { ...EMPTY_BEST }
    for (const k of Object.keys(out) as (keyof BestRuns)[]) if (num(p[k])) out[k] = p[k] as number
    return out
  } catch {
    return EMPTY_BEST
  }
}
export const saveBest = (b: BestRuns) => set(BEST_KEY, JSON.stringify(b))

export function loadGlobalAchievements(): string[] {
  const raw = get(ACH_KEY)
  if (!raw) return []
  try {
    const p: unknown = JSON.parse(raw)
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
export const saveGlobalAchievements = (ids: string[]) => set(ACH_KEY, JSON.stringify(Array.from(new Set(ids))))

export function clearEverything() {
  remove(SAVE_KEY)
  remove(BEST_KEY)
  remove(ACH_KEY)
}
