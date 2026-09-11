import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { GameState, StatKey } from '../types/game'
import { STAT_LABEL, getPhase } from '../game/balance'
import { fmtDelta } from './ui'

const LINES = [
  "Tomorrow doesn't care.",
  'Sleep. The sheet will still be there.',
  'One day closer. To what, unclear.',
  'The countdown continues, unbothered.',
  'That was a day. It counted.',
]

export function DayTransition({ state, onStart }: { state: GameState; onStart: () => void }) {
  const s = state.daySummary!
  const [ready, setReady] = useState(false)
  const next = state.day + 1
  const phase = getPhase(next)
  const changed = (Object.entries(s.deltas) as [StatKey, number][]).filter(([, v]) => Math.abs(v) >= 0.5).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6)
  const line = LINES[next % LINES.length]

  useEffect(() => {
    const reduced = document.documentElement.getAttribute('data-reduced-motion') === 'true'
    const t = window.setTimeout(() => setReady(true), reduced ? 0 : 900)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStart() } }
    window.addEventListener('keydown', onKey)
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [onStart])

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Day {s.day}</motion.p>
        <motion.h1 className="serif text-[72px] sm:text-[96px] leading-none mt-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          Done<span className="mark px-1">.</span>
        </motion.h1>

        <motion.ul className="mt-8 border-t hairline" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } } }}>
          {changed.length === 0 && (
            <motion.li variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="py-2.5 text-[14px] text-muted">Nothing changed. Which is also a choice.</motion.li>
          )}
          {changed.map(([k, v]) => (
            <motion.li key={k} variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }} className="flex justify-between py-2.5 border-b hairline text-[15px]">
              <span className="text-muted">{STAT_LABEL[k]}</span>
              <span className={`font-semibold tnum ${v > 0 ? 'text-success' : 'text-danger'}`}>{fmtDelta(k, v)}</span>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.4 }}>
          <p className="serif text-[22px] text-muted">“{phase.from === next ? phase.copy : line}”</p>
          <button onClick={onStart} disabled={!ready} className="btn btn-primary press mt-6 w-full sm:w-auto">
            Start day {next} <span aria-hidden>→</span>
          </button>
          <p className="mt-3 text-[11px] text-faint">Enter to continue</p>
        </motion.div>
      </div>
    </main>
  )
}
