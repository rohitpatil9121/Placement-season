import { motion } from 'framer-motion'
import { Settings2, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ActionId, Effects, GameState } from '../types/game'
import { ACTIONS } from '../game/actions'
import { getPhase } from '../game/balance'
import { ActionList } from './ActionList'
import { DayHero } from './DayHero'
import { Opportunities } from './Opportunities'
import { Recent } from './Recent'
import { StatePanel, StateStrip } from './StatePanel'
import { Mascot, moodFor } from './Mascot'

type Props = {
  state: GameState
  deltas: Effects
  line: string
  shake: number
  savedAt: number | null
  hint: boolean
  nonce: number
  unseen: number
  sound: boolean
  onToggleSound: () => void
  onTrophies: () => void
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
  const [peek, setPeek] = useState<Effects | null>(null)
  const blocked = !!state.activeEvent || !!state.interview
  const allUsed = state.stats.energy < 10
  const mood = moodFor(state.stats)
  const bump = state.metrics.eventsSeen + state.log.length

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
        <button onClick={p.onHome} className="press inline-flex items-center gap-2.5 rounded-full pl-1.5 pr-4 py-1.5 bg-surface border hairline shadow-[0_8px_20px_-14px_rgba(0,0,0,0.4)] text-[11px] sm:text-[12px] tracking-[0.16em] uppercase font-bold whitespace-nowrap">
          <span className="w-7 h-7 rounded-full" style={{ background: 'var(--phase-accent)' }} aria-hidden />
          Placement Season
        </button>
        <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-surface border hairline px-2 py-1 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.4)]">
          <span className="hidden sm:inline pl-2"><SavedLabel at={p.savedAt} /></span>
          <button onClick={p.onToggleSound} aria-label={p.sound ? 'Mute sound' : 'Unmute sound'} aria-pressed={p.sound} className="press w-11 h-11 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface">
            {p.sound ? <Volume2 size={18} strokeWidth={1.75} /> : <VolumeX size={18} strokeWidth={1.75} />}
          </button>
          <button onClick={p.onTrophies} aria-label={p.unseen ? `Achievements, ${p.unseen} new` : 'Achievements'} className={`press w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface ${p.unseen ? 'pulse-ring' : 'text-muted hover:text-ink'}`} style={p.unseen ? { background: '#F5C542', color: '#3B2A00' } : undefined}>
            <Trophy size={18} strokeWidth={1.75} />
          </button>
          <button onClick={p.onSettings} aria-label="Settings" className="press w-11 h-11 -mr-2 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface">
            <Settings2 size={18} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8 pb-28 lg:pb-16 grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
        <div className="min-w-0">
          <DayHero day={state.day} mood={mood} bump={bump} />
          <p className="mt-4 serif text-[22px]" style={{ color: 'var(--phase-ink)' }}>{phase.copy}</p>

          <div className="lg:hidden mt-5 flex items-end gap-3 panel p-4">
            <Mascot mood={mood} bump={bump} size={64} className="shrink-0 -mb-1" />
            <div className="flex-1 min-w-0"><StateStrip state={state} /></div>
          </div>

          <div className="mt-8 panel p-5 sm:p-6">
            <ActionList state={state} onAct={p.onAct} hint={p.hint} deltas={p.deltas} nonce={p.nonce} onPeek={setPeek} />
          </div>

          {p.line && (
            <motion.p key={p.line} className="serif text-[24px] text-muted mt-6" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} aria-live="polite">
              {p.line}
            </motion.p>
          )}

          <div className="hidden lg:flex mt-8 items-center gap-4">
            <button onClick={p.onEndDay} disabled={blocked} className={`btn press ${allUsed ? 'btn-primary' : 'btn-ghost'}`}>
              End day
            </button>
            <kbd className="text-[11px] text-faint">E</kbd>
          </div>
        </div>

        <aside className="space-y-5 lg:pt-3">
          <StatePanel state={state} deltas={p.deltas} peek={peek} />
          <Opportunities state={state} onApply={p.onApply} onIgnore={p.onIgnore} />
          <Recent log={state.log} day={state.day} />
        </aside>
      </main>

      {/* mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/85 backdrop-blur border-t hairline px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <p className="text-[13px] text-muted tnum font-medium">Day {state.day}</p>
          <button onClick={p.onEndDay} disabled={blocked} className={`btn press ${allUsed ? 'btn-primary' : 'btn-ghost'}`}>End day</button>
        </div>
      </div>
    </div>
  )
}
