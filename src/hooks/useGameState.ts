import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ActionId, Effects, FloatingDelta, GameState, Settings } from '../types/game'
import {
  canPerformAction,
  checkAchievements,
  createInitialState,
  endDay as endDayLogic,
  performAction,
  resolveEvent as resolveEventLogic,
  sanitizeState,
} from '../utils/gameLogic'
import {
  addLeaderboardEntry,
  clearAllData,
  clearSave,
  loadGame,
  loadGlobalAchievements,
  loadLeaderboard,
  loadSettings,
  saveGame,
  saveGlobalAchievements,
  saveSettings,
  type LeaderboardEntry,
} from '../utils/storage'
import { toCgpa } from '../utils/scoring'
import { ACHIEVEMENT_MAP } from '../data/achievements'
import type { SoundKind } from './useSound'

export type View = 'start' | 'tutorial' | 'game' | 'result'

export type Toast = {
  id: number
  kind: 'achievement' | 'info' | 'error' | 'saved'
  title: string
  body?: string
  emoji?: string
}

export type Fx = { shake: number; glow: number; confetti: number }

let uid = 1
const nextId = () => uid++

export function useGameState(play: (k: SoundKind) => void) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [state, setState] = useState<GameState | null>(null)
  const [hasSave, setHasSave] = useState(false)
  const [view, setView] = useState<View>('start')
  const [floats, setFloats] = useState<FloatingDelta[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [fx, setFx] = useState<Fx>({ shake: 0, glow: 0, confetti: 0 })
  const [lastDeltas, setLastDeltas] = useState<Effects>({})
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard())
  const [globalAchievements, setGlobalAchievements] = useState<string[]>(() => loadGlobalAchievements())
  const [savedTick, setSavedTick] = useState(0)
  const recordedRef = useRef(false)

  // ---- initial load ----
  useEffect(() => {
    const { state: saved, corrupted } = loadGame()
    if (corrupted) {
      pushToast({ kind: 'error', emoji: '🌀', title: 'Save lost', body: 'Your previous save disappeared into the placement portal. Starting fresh.' })
    }
    if (saved) {
      const s = sanitizeState(saved)
      setState(s)
      setHasSave(true)
      recordedRef.current = s.status === 'finished'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- reduced motion attribute ----
  useEffect(() => {
    document.documentElement.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false')
  }, [settings.reducedMotion])

  // ---- persistence ----
  useEffect(() => {
    if (!state) return
    saveGame(state)
    setHasSave(true)
    setSavedTick((t) => t + 1)
  }, [state])

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId()
    setToasts((list) => [...list.slice(-3), { ...t, id }])
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), t.kind === 'achievement' ? 4500 : 3200)
  }, [])

  const dismissToast = useCallback((id: number) => setToasts((l) => l.filter((t) => t.id !== id)), [])

  const spawnFloats = useCallback((deltas: Effects) => {
    const entries = Object.entries(deltas) as [FloatingDelta['key'], number][]
    if (!entries.length) return
    const items = entries.map(([key, delta]) => ({ id: nextId(), key, delta }))
    setFloats((f) => [...f, ...items])
    window.setTimeout(() => setFloats((f) => f.filter((x) => !items.some((i) => i.id === x.id))), 1600)
  }, [])

  const bump = useCallback((key: keyof Fx) => setFx((f) => ({ ...f, [key]: f[key] + 1 })), [])

  /** run achievement checks, fire toasts + sounds, return updated state */
  const withAchievements = useCallback(
    (s: GameState): GameState => {
      const { state: next, unlocked } = checkAchievements(s)
      if (unlocked.length) {
        unlocked.forEach((id, i) => {
          const a = ACHIEVEMENT_MAP[id]
          window.setTimeout(() => {
            pushToast({ kind: 'achievement', emoji: a.emoji, title: a.name, body: a.description })
            play('achievement')
          }, i * 500)
        })
        bump('confetti')
        setGlobalAchievements((g) => {
          const merged = Array.from(new Set([...g, ...unlocked]))
          saveGlobalAchievements(merged)
          return merged
        })
      }
      return next
    },
    [bump, play, pushToast],
  )

  // ---- game flow ----
  const startNewGame = useCallback(() => {
    clearSave()
    const fresh = createInitialState()
    recordedRef.current = false
    setState(fresh)
    setLastDeltas({})
    setFloats([])
    setView(settings.tutorialDone ? 'game' : 'tutorial')
    play('click')
  }, [play, settings.tutorialDone])

  const continueGame = useCallback(() => {
    if (!state) return
    setView(state.status === 'finished' ? 'result' : 'game')
    play('click')
  }, [play, state])

  const openTutorial = useCallback(() => {
    setView('tutorial')
    play('click')
  }, [play])

  const finishTutorial = useCallback(() => {
    setSettings((s) => {
      const next = { ...s, tutorialDone: true }
      saveSettings(next)
      return next
    })
    setView(state && state.status === 'playing' ? 'game' : state ? 'result' : 'start')
    if (!state) {
      const fresh = createInitialState()
      recordedRef.current = false
      setState(fresh)
      setView('game')
    }
  }, [state])

  const goToStart = useCallback(() => {
    setView('start')
    play('click')
  }, [play])

  const doAction = useCallback(
    (id: ActionId) => {
      if (!state) return
      const check = canPerformAction(state, id)
      if (!check.ok) {
        if (check.reason) pushToast({ kind: 'error', emoji: '🚫', title: check.reason })
        play('error')
        return
      }
      const res = performAction(state, id)
      if (!res.ok) return
      const next = withAchievements(res.state)
      setState(next)
      setLastDeltas(res.deltas)
      spawnFloats(res.deltas)
      play('click')
      if (next.pendingEvent) {
        window.setTimeout(() => play(next.pendingEvent?.event.rarity === 'legendary' ? 'legendary' : 'event'), 250)
      }
    },
    [play, pushToast, spawnFloats, state, withAchievements],
  )

  const resolveEvent = useCallback(
    (choiceIndex?: number) => {
      if (!state || !state.pendingEvent) return
      const ev = state.pendingEvent.event
      const res = resolveEventLogic(state, choiceIndex)
      const next = withAchievements(res.state)
      setState(next)
      setLastDeltas(res.deltas)
      spawnFloats(res.deltas)
      const negative = Object.values(res.deltas).reduce((a, b) => a + (b ?? 0), 0) < 0
      if (ev.rarity === 'legendary') bump('glow')
      if (negative && (ev.tags?.includes('breakdown') || ev.rarity !== 'common')) bump('shake')
      play(negative ? 'error' : 'success')
    },
    [bump, play, spawnFloats, state, withAchievements],
  )

  const endDay = useCallback(() => {
    if (!state) return
    const res = endDayLogic(state)
    if (res.state === state) return
    const next = withAchievements(res.state)
    setState(next)
    setLastDeltas(res.deltas)
    spawnFloats(res.deltas)
    if (res.finished) {
      setView('result')
      play('celebrate')
      bump('confetti')
    } else {
      play('click')
      if (next.pendingEvent) {
        window.setTimeout(() => play(next.pendingEvent?.event.rarity === 'legendary' ? 'legendary' : 'event'), 300)
      }
    }
  }, [bump, play, spawnFloats, state, withAchievements])

  // record leaderboard entry once per finished run
  useEffect(() => {
    if (!state || state.status !== 'finished' || !state.finalResult || recordedRef.current) return
    recordedRef.current = true
    const r = state.finalResult
    const list = addLeaderboardEntry({
      id: `${state.seed}-${state.startedAt}`,
      date: Date.now(),
      score: r.score,
      salaryLpa: r.salaryLpa,
      title: r.outcome.title,
      emoji: r.outcome.emoji,
      company: r.company,
      dsa: Math.round(state.stats.dsa),
      cgpa: toCgpa(state.stats.cgpa),
    })
    setLeaderboard(list)
  }, [state])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const resetGame = useCallback(() => {
    clearSave()
    setState(null)
    setHasSave(false)
    recordedRef.current = false
    setView('start')
    pushToast({ kind: 'info', emoji: '🧹', title: 'Save cleared', body: 'Fresh semester. Same anxiety.' })
  }, [pushToast])

  const resetEverything = useCallback(() => {
    clearAllData()
    setState(null)
    setHasSave(false)
    setLeaderboard([])
    setGlobalAchievements([])
    recordedRef.current = false
    setView('start')
    pushToast({ kind: 'info', emoji: '🧹', title: 'Everything reset', body: 'Leaderboard, achievements and save are gone.' })
  }, [pushToast])

  const api = useMemo(
    () => ({
      startNewGame,
      continueGame,
      openTutorial,
      finishTutorial,
      goToStart,
      doAction,
      resolveEvent,
      endDay,
      updateSettings,
      resetGame,
      resetEverything,
      dismissToast,
      pushToast,
    }),
    [
      startNewGame, continueGame, openTutorial, finishTutorial, goToStart, doAction, resolveEvent, endDay,
      updateSettings, resetGame, resetEverything, dismissToast, pushToast,
    ],
  )

  return {
    state,
    settings,
    view,
    hasSave,
    floats,
    toasts,
    fx,
    lastDeltas,
    leaderboard,
    globalAchievements,
    savedTick,
    ...api,
  }
}

export type GameApi = ReturnType<typeof useGameState>
