import { useCallback, useEffect, useRef, useState } from 'react'
import type { ActionId, BestRuns, Effects, GameState, Settings } from '../types/game'
import {
  answerInterview, applyEvent, applyToCompany, canAct, closeInterview, createGame, endDay as endDayFn,
  ignoreCompany, performAction, sanitize, startDay as startDayFn, unlockAchievements,
} from '../game/engine'
import { ACHIEVEMENT_MAP } from '../game/achievements'
import { toCgpa } from '../game/scoring'
import { getPhase } from '../game/balance'
import { PHASE_THEME } from '../components/theme'
import {
  clearEverything, clearSave, loadBest, loadGame, loadGlobalAchievements, loadSettings, saveBest, saveGame,
  saveGlobalAchievements, saveSettings,
} from '../utils/storage'
import type { SoundKind } from './useSound'

export type View = 'start' | 'game' | 'result'
export type Notice = { id: number; kind: 'achievement' | 'info' | 'error'; title: string; body?: string }

let uid = 1

export function useGame(play: (k: SoundKind) => void) {
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings())
  const [state, setState] = useState<GameState | null>(null)
  const [view, setView] = useState<View>('start')
  const [notices, setNotices] = useState<Notice[]>([])
  const [lastDeltas, setLastDeltas] = useState<Effects>({})
  const [lastLine, setLastLine] = useState<string>('')
  const [shake, setShake] = useState(0)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [best, setBest] = useState<BestRuns>(() => loadBest())
  const [globalAchievements, setGlobalAchievements] = useState<string[]>(() => loadGlobalAchievements())
  const [corrupted, setCorrupted] = useState(false)
  const recorded = useRef(false)

  useEffect(() => {
    const { state: saved, corrupted: bad } = loadGame()
    if (bad) setCorrupted(true)
    if (saved) {
      const s = sanitize(saved)
      setState(s)
      recorded.current = s.status === 'finished'
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false')
    document.documentElement.setAttribute('data-theme', settings.dark ? 'dark' : 'light')
  }, [settings.reducedMotion, settings.dark])

  // phase tint follows the day; the start screen and results use their own
  useEffect(() => {
    const root = document.documentElement.style
    const phase = state && view === 'game' ? getPhase(state.day).id : view === 'result' ? 'day90' : 'prep'
    const th = PHASE_THEME[phase]
    root.setProperty('--phase-tint', settings.dark ? th.tintDark : th.tint)
    root.setProperty('--phase-accent', th.accent)
    root.setProperty('--phase-ink', th.ink)
  }, [state, view, settings.dark])

  useEffect(() => {
    if (!state) return
    saveGame(state)
    setSavedAt(Date.now())
  }, [state])

  const notify = useCallback((n: Omit<Notice, 'id'>) => {
    const id = uid++
    setNotices((l) => [...l.slice(-2), { ...n, id }])
    window.setTimeout(() => setNotices((l) => l.filter((x) => x.id !== id)), n.kind === 'achievement' ? 4200 : 3000)
  }, [])
  const dismiss = useCallback((id: number) => setNotices((l) => l.filter((x) => x.id !== id)), [])

  const commit = useCallback(
    (next: GameState) => {
      const { state: s, unlocked } = unlockAchievements(next)
      if (unlocked.length) {
        unlocked.forEach((id, i) => {
          const a = ACHIEVEMENT_MAP[id]
          window.setTimeout(() => {
            notify({ kind: 'achievement', title: a.name, body: a.description })
            play('unlock')
          }, 400 + i * 600)
        })
        setGlobalAchievements((g) => {
          const merged = Array.from(new Set([...g, ...unlocked]))
          saveGlobalAchievements(merged)
          return merged
        })
      }
      setState(s)
      return s
    },
    [notify, play],
  )

  // ---- flow ----
  const startNew = useCallback(() => {
    clearSave()
    recorded.current = false
    setLastDeltas({})
    setLastLine('')
    setState(createGame())
    setView('game')
    play('tick')
  }, [play])

  const continueGame = useCallback(() => {
    if (!state) return
    setView(state.status === 'finished' ? 'result' : 'game')
    play('tick')
  }, [play, state])

  const home = useCallback(() => setView('start'), [])

  const act = useCallback(
    (id: ActionId) => {
      if (!state) return
      const check = canAct(state, id)
      if (!check.ok) {
        if (check.reason) notify({ kind: 'error', title: check.reason })
        return
      }
      const r = performAction(state, id)
      if (!r.ok) return
      commit(r.state)
      setLastDeltas(r.deltas)
      setLastLine(r.line)
      play('tick')
      if (r.state.activeEvent) window.setTimeout(() => play('event'), 220)
    },
    [commit, notify, play, state],
  )

  const resolveEvent = useCallback(
    (choice?: number) => {
      if (!state?.activeEvent) return
      const ev = state.activeEvent
      const r = applyEvent(state, choice)
      commit(r.state)
      setLastDeltas(r.deltas)
      setLastLine(r.line)
      const net = Object.values(r.deltas).reduce((a, b) => a + (b ?? 0), 0)
      if (net < -6 && ev.rarity !== 'common') setShake((n) => n + 1)
      play(net < 0 ? 'bad' : 'done')
    },
    [commit, play, state],
  )

  const finishDay = useCallback(() => {
    if (!state) return
    const next = endDayFn(state)
    if (next === state) return
    commit(next)
    setLastDeltas({})
    if (next.status === 'finished') {
      setView('result')
      play('result')
    } else play('done')
  }, [commit, play, state])

  const beginDay = useCallback(() => {
    if (!state || state.status !== 'dayEnd') return
    const next = startDayFn(state)
    commit(next)
    setLastDeltas({})
    setLastLine('')
    play('tick')
    if (next.activeEvent) window.setTimeout(() => play('event'), 300)
    if (next.interview) window.setTimeout(() => play('event'), 300)
  }, [commit, play, state])

  const apply = useCallback(
    (companyId: string) => {
      if (!state) return
      const next = applyToCompany(state, companyId)
      if (next !== state) {
        commit(next)
        play('tick')
      }
    },
    [commit, play, state],
  )

  const ignore = useCallback(
    (companyId: string) => {
      if (!state) return
      setState(ignoreCompany(state, companyId))
    },
    [state],
  )

  const answer = useCallback(
    (i: number) => {
      if (!state?.interview) return
      const next = answerInterview(state, i)
      commit(next)
      if (next.interview?.outcome === 'offer') play('big')
      else if (next.interview?.outcome === 'rejected') play('bad')
      else play('tick')
    },
    [commit, play, state],
  )

  const endInterview = useCallback(() => {
    if (!state?.interview) return
    commit(closeInterview(state))
  }, [commit, state])

  // record best runs once per finished game
  useEffect(() => {
    if (!state || state.status !== 'finished' || !state.result || recorded.current) return
    recorded.current = true
    const r = state.result
    const chaos = state.metrics.breakdowns + state.metrics.coffees + state.metrics.rejections
    const b: BestRuns = {
      runs: best.runs + 1,
      bestScore: Math.max(best.bestScore, r.score),
      bestSalary: Math.max(best.bestSalary, r.salaryLpa),
      bestDsa: Math.max(best.bestDsa, Math.round(state.stats.dsa)),
      bestCgpa: Math.max(best.bestCgpa, toCgpa(state.stats.cgpa)),
      mostChaotic: Math.max(best.mostChaotic, chaos),
    }
    saveBest(b)
    setBest(b)
  }, [state, best])

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((s) => {
      const next = { ...s, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const resetRun = useCallback(() => {
    clearSave()
    setState(null)
    recorded.current = false
    setView('start')
  }, [])

  const resetAll = useCallback(() => {
    clearEverything()
    setState(null)
    setBest(loadBest())
    setGlobalAchievements([])
    recorded.current = false
    setView('start')
    notify({ kind: 'info', title: 'Everything cleared.', body: 'Fresh semester. Same anxiety.' })
  }, [notify])

  return {
    state, settings, view, notices, lastDeltas, lastLine, shake, savedAt, best, globalAchievements, corrupted,
    startNew, continueGame, home, act, resolveEvent, finishDay, beginDay, apply, ignore, answer, endInterview,
    setSettings, resetRun, resetAll, dismiss, notify, setView,
  }
}

export type Game = ReturnType<typeof useGame>
