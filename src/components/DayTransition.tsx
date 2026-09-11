import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { GameState, StatKey } from '../types/game'
import { STAT_LABEL, getPhase } from '../game/balance'
import { fmtDelta, Num } from './ui'
import { Confetti } from './Confetti'
import { STAT_COLOR } from './theme'
import { toCgpa } from '../game/scoring'

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
  const changed = (Object.entries(s.deltas) as [StatKey, number][]).filter(([k, v]) => k !== 'energy' && Math.abs(v) >= 0.5).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6)
  const line = LINES[next % LINES.length]
  const goodness = (Object.entries(s.deltas) as [StatKey, number][]).reduce((a, [k, v]) => a + (k === 'cgpa' ? v * 2 : v) * (k === 'energy' || k === 'sleep' ? 0.4 : 1), 0)
  const burst = goodness > 18 ? 1 : goodness > 6 ? 0.35 : 0

  useEffect(() => {
    const reduced = document.documentElement.getAttribute('data-reduced-motion') === 'true'
    const t = window.setTimeout(() => setReady(true), reduced ? 0 : 900)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStart() } }
    window.addEventListener('keydown', onKey)
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [onStart])

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <Confetti trigger={burst > 0 ? s.day : 0} amount={burst} />
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
            <motion.li key={k} variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }} className="flex justify-between items-center py-2.5 border-b hairline text-[15px]">
              <span className="inline-flex items-center gap-2 text-muted"><span className="w-2 h-2 rounded-full" style={{ background: STAT_COLOR[k] }} aria-hidden />{STAT_LABEL[k]}</span>
              <span className={`font-semibold tnum ${v > 0 ? 'text-success' : 'text-danger'}`} aria-label={fmtDelta(k, v)}>
                {v > 0 ? '+' : '−'}<Num value={Math.abs(k === 'cgpa' ? v / 20 : v)} decimals={k === 'cgpa' ? 2 : 0} /> <span className="text-[12px] text-muted font-normal">→ {k === 'cgpa' ? toCgpa(state.stats[k]).toFixed(1) : Math.round(state.stats[k])}</span>
              </span>
            </motion.li>
          ))}
          {s.lostStreaks.map((k) => (
            <motion.li key={`lost-${k}`} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="py-2.5 border-b hairline">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'rgba(217,92,92,0.12)', color: '#9B2C2C' }}>Streak lost · {k === 'dsa' ? 'DSA' : k === 'study' ? 'Study' : 'Sleep'}</span>
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
