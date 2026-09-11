import { motion } from 'framer-motion'
import { Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ActionId, Effects, GameState } from '../types/game'
import { ACTIONS } from '../data/actions'
import { ACTIONS_PER_DAY, getPhase } from '../data/phases'
import { PRIMARY_STATS, canPerformAction } from '../utils/gameLogic'
import { ActionCard } from './ActionCard'
import { ActivityLog } from './ActivityLog'
import { DayProgress } from './DayProgress'
import { StatCard } from './StatCard'

type Props = {
  state: GameState
  lastDeltas: Effects
  shakeTick: number
  reduced: boolean
  onAction: (id: ActionId) => void
  onEndDay: () => void
}

export function GameScreen({ state, lastDeltas, shakeTick, reduced, onAction, onEndDay }: Props) {
  const phase = getPhase(state.day)
  const [shaking, setShaking] = useState(false)
  const allUsed = state.actionsLeft === 0

  useEffect(() => {
    if (!shakeTick || reduced) return
    setShaking(true)
    const t = window.setTimeout(() => setShaking(false), 500)
    return () => window.clearTimeout(t)
  }, [shakeTick, reduced])

  // keyboard shortcuts: 1-9 for actions, E for end day
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.pendingEvent || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.key.toLowerCase() === 'e') onEndDay()
      const n = Number(e.key)
      if (n >= 1 && n <= ACTIONS.length) onAction(ACTIONS[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onAction, onEndDay, state.pendingEvent])

  return (
    <div className={`${shaking ? 'shake' : ''} pb-28 lg:pb-6`}>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_340px] mt-3 sm:mt-4">
        {/* left column */}
        <div className="space-y-3 sm:space-y-4 min-w-0">
          <DayProgress day={state.day} />

          <section aria-label="Your stats" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {PRIMARY_STATS.map((k) => (
              <StatCard key={k} statKey={k} value={state.stats[k]} delta={lastDeltas[k]} />
            ))}
          </section>

          <section aria-label="Today's plan" className="glass rounded-2xl p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display font-bold text-lg">Today's Plan</h2>
                <p className="text-xs text-muted">
                  {phase.emoji} {phase.tagline}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Actions</div>
                <div className="font-display text-xl tracking-[0.25em]" aria-label={`${state.actionsLeft} of ${ACTIONS_PER_DAY} actions remaining`}>
                  {Array.from({ length: ACTIONS_PER_DAY }, (_, i) => (
                    <motion.span
                      key={i}
                      className={i < state.actionsLeft ? 'text-primary' : 'text-white/15'}
                      animate={{ scale: i < state.actionsLeft ? 1 : 0.8 }}
                      aria-hidden
                    >
                      ●
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {ACTIONS.map((a) => {
                const check = canPerformAction(state, a.id)
                return (
                  <ActionCard
                    key={a.id}
                    action={a}
                    disabled={!check.ok}
                    reason={check.reason === 'Not enough actions left today.' ? undefined : check.reason}
                    usedToday={state.actionsUsedToday[a.id] ?? 0}
                    onClick={() => onAction(a.id)}
                  />
                )
              })}
            </div>

            <div className="hidden lg:flex mt-4 justify-end">
              <EndDayButton allUsed={allUsed} onClick={onEndDay} />
            </div>
          </section>
        </div>

        {/* right column */}
        <div className="min-w-0">
          <ActivityLog log={state.log} day={state.day} />
        </div>
      </div>

      {/* mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 pb-[max(12px,env(safe-area-inset-bottom))]" style={{ background: 'linear-gradient(180deg, transparent, #0B1020 40%)' }}>
        <div className="glass rounded-2xl p-2.5 flex items-center gap-3 max-w-3xl mx-auto">
          <div className="pl-2 text-sm">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Day {state.day}</div>
            <div className="font-display tracking-[0.2em]" aria-hidden>
              {Array.from({ length: ACTIONS_PER_DAY }, (_, i) => (
                <span key={i} className={i < state.actionsLeft ? 'text-primary' : 'text-white/15'}>●</span>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <EndDayButton allUsed={allUsed} onClick={onEndDay} full />
          </div>
        </div>
      </div>
    </div>
  )
}

function EndDayButton({ allUsed, onClick, full }: { allUsed: boolean; onClick: () => void; full?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      className={`focus-ring min-h-12 rounded-2xl px-6 font-display font-bold tracking-wider flex items-center justify-center gap-2 ${
        allUsed ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'glass hover:border-primary/50'
      } ${full ? 'w-full' : ''}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      animate={allUsed ? { boxShadow: ['0 0 0 0 rgba(124,92,252,0.5)', '0 0 0 10px rgba(124,92,252,0)'] } : undefined}
      transition={allUsed ? { repeat: Infinity, duration: 1.4 } : undefined}
      aria-label={allUsed ? 'End day' : 'End day early (unused actions are wasted)'}
    >
      <Moon size={18} /> END DAY {!allUsed && <span className="text-[10px] font-sans font-medium opacity-70">(skip rest)</span>}
    </motion.button>
  )
}
