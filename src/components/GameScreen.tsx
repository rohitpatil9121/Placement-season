import { motion } from 'framer-motion'
import { Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ActionId, Effects, GameState } from '../types/game'
import { ACTIONS } from '../game/actions'
import { getPhase } from '../game/balance'
import { ActionDots, ActionList } from './ActionList'
import { DayHero } from './DayHero'
import { Opportunities } from './Opportunities'
import { Recent } from './Recent'
import { StatePanel, StateStrip } from './StatePanel'

type Props = {
  state: GameState
  deltas: Effects
  line: string
  shake: number
  savedAt: number | null
  hint: boolean
  onAct: (id: ActionId) => void
  onEndDay: () => void
  onApply: (id: string) => void
  onIgnore: (id: string) => void
  onSettings: () => void
  onHome: () => void
}

function SavedLabel({ at }: { at: number | null }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 15000)
    return () => window.clearInterval(t)
  }, [])
  if (!at) return null
  const s = Math.round((Date.now() - at) / 1000)
  const label = s < 20 ? 'Saved just now' : s < 90 ? 'Saved a minute ago' : `Saved ${Math.round(s / 60)} min ago`
  return <span className="text-[11px] text-faint" aria-live="polite">{label}</span>
}

export function GameScreen(p: Props) {
  const { state } = p
  const phase = getPhase(state.day)
  const [shaking, setShaking] = useState(false)
  const blocked = !!state.activeEvent || !!state.interview
  const allUsed = state.actionsRemaining === 0

  useEffect(() => {
    if (!p.shake) return
    setShaking(true)
    const t = window.setTimeout(() => setShaking(false), 360)
    return () => window.clearTimeout(t)
  }, [p.shake])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (blocked || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (e.key.toLowerCase() === 'e') p.onEndDay()
      const n = Number(e.key)
      if (n >= 1 && n <= 9 && ACTIONS[n - 1]) p.onAct(ACTIONS[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [blocked, p])

  return (
    <div className={`min-h-dvh ${shaking ? 'shake' : ''}`}>
      <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between">
        <button onClick={p.onHome} className="press text-[11px] sm:text-[12px] tracking-[0.16em] uppercase font-semibold whitespace-nowrap">Placement Season</button>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline"><SavedLabel at={p.savedAt} /></span>
          <button onClick={p.onSettings} aria-label="Settings" className="press w-11 h-11 -mr-2 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface">
            <Settings2 size={18} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-28 lg:pb-16 grid lg:grid-cols-[1fr_300px] gap-12 lg:gap-16">
        <div className="min-w-0">
          <DayHero day={state.day} />
          <p className="mt-4 text-[13px] text-muted">{phase.copy}</p>

          <div className="lg:hidden mt-8">
            <StateStrip state={state} />
          </div>

          <div className="mt-10 lg:mt-12">
            <ActionList state={state} onAct={p.onAct} hint={p.hint} />
          </div>

          {p.line && (
            <motion.p key={p.line} className="serif text-[20px] text-muted mt-6" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} aria-live="polite">
              {p.line}
            </motion.p>
          )}

          <div className="hidden lg:flex mt-8 items-center gap-4">
            <button onClick={p.onEndDay} disabled={blocked} className={`btn press ${allUsed ? 'btn-primary' : 'btn-ghost'}`}>
              End day {!allUsed && <span className="text-muted font-normal">· skip the rest</span>}
            </button>
            <kbd className="text-[11px] text-faint">E</kbd>
          </div>
        </div>

        <aside className="space-y-10 lg:pt-3">
          <StatePanel state={state} deltas={p.deltas} />
          <Opportunities state={state} onApply={p.onApply} onIgnore={p.onIgnore} />
          <Recent log={state.log} day={state.day} />
        </aside>
      </main>

      {/* mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper/90 backdrop-blur border-t hairline px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <div>
            <ActionDots remaining={state.actionsRemaining} />
            <p className="text-[11px] text-muted mt-1 tnum">Day {state.day} · {state.actionsRemaining} left</p>
          </div>
          <button onClick={p.onEndDay} disabled={blocked} className={`btn press ${allUsed ? 'btn-primary' : 'btn-ghost'}`}>End day</button>
        </div>
      </div>
    </div>
  )
}
