import { motion } from 'framer-motion'
import { Brain, Coffee, GraduationCap, Heart, Moon } from 'lucide-react'
import type { BestRuns, GameState } from '../types/game'
import { Mascot } from './Mascot'
import { GOLD, STAT_COLOR } from './theme'

type Props = {
  saved: GameState | null
  best: BestRuns
  corrupted: boolean
  onStart: () => void
  onContinue: () => void
  onSettings: () => void
}

const CHIPS = [
  { I: Moon, label: 'Sleep', c: STAT_COLOR.sleep, x: '84%', y: '12%', d: 0.6 },
  { I: Brain, label: 'DSA', c: STAT_COLOR.dsa, x: '72%', y: '70%', d: 1.1 },
  { I: GraduationCap, label: 'CGPA', c: STAT_COLOR.cgpa, x: '12%', y: '74%', d: 0.3 },
  { I: Heart, label: 'Wellbeing', c: STAT_COLOR.wellbeing, x: '90%', y: '44%', d: 0.9 },
  { I: Coffee, label: 'Coffee', c: '#B45309', x: '40%', y: '86%', d: 1.4 },
]

export function StartScreen({ saved, best, corrupted, onStart, onContinue, onSettings }: Props) {
  const inProgress = saved && saved.status !== 'finished'
  return (
    <main className="min-h-dvh flex flex-col relative overflow-hidden">
      {/* floating stat chips */}
      {CHIPS.map(({ I, label, c, x, y, d }) => (
        <motion.span
          key={label}
          className="absolute hidden sm:inline-flex items-center gap-2 rounded-full pl-2 pr-3.5 py-1.5 text-[13px] font-semibold bg-surface border hairline shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] select-none"
          style={{ left: x, top: y, color: c }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{ opacity: { delay: 0.3 + d * 0.3 }, y: { repeat: Infinity, duration: 4 + d, ease: 'easeInOut', delay: d } }}
          aria-hidden
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: c }}><I size={14} strokeWidth={2.2} /></span>
          {label}
        </motion.span>
      ))}

      <div className="flex-1 flex items-center">
        <motion.div
          className="w-full max-w-5xl mx-auto px-6 sm:px-10 py-16 grid lg:grid-cols-[1fr_auto] items-center gap-10"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] tracking-[0.14em] uppercase font-bold text-white" style={{ background: 'var(--phase-accent)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white" /> 90 days before placement
            </p>
            <h1 className="serif text-[64px] sm:text-[112px] lg:text-[128px] leading-[0.92] mt-6 -ml-1">
              <span style={{ color: STAT_COLOR.dsa }}>Placement</span>
              <br />
              <span className="relative inline-block">
                Season
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 22" preserveAspectRatio="none" aria-hidden><path d="M4 14 C 100 2, 200 26, 396 8" stroke={GOLD} strokeWidth="9" fill="none" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="mt-9 text-xl sm:text-2xl text-ink/80 max-w-md font-medium">One decision at a time. How badly can this go?</p>

            {corrupted && (
              <div className="mt-8 max-w-md card p-4 text-sm">
                <p className="font-semibold">Your save file had a placement-related incident.</p>
                <p className="text-muted mt-1">It could not be read, so it was set aside. Start fresh below.</p>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-3">
              {inProgress ? (
                <>
                  <button onClick={onContinue} className="btn btn-primary press text-[15px] min-h-12 px-7">Continue · Day {saved.day}</button>
                  <button onClick={onStart} className="btn btn-ghost press min-h-12">New game</button>
                </>
              ) : (
                <>
                  <button onClick={onStart} className="btn press text-[15px] min-h-12 px-8 text-white shadow-[0_12px_30px_-12px_rgba(139,92,246,0.7)]" style={{ background: STAT_COLOR.dsa }}>Start playing</button>
                  {saved?.status === 'finished' && <button onClick={onContinue} className="btn btn-ghost press min-h-12">Last result</button>}
                </>
              )}
              <button onClick={onSettings} className="btn press text-muted hover:text-ink">Settings</button>
            </div>
          </div>

          <motion.div className="hidden lg:flex flex-col items-center gap-3" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>
            <div className="rounded-[32px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 30px 60px -30px rgba(0,0,0,0.35)' }}>
              <Mascot mood="hyped" size={220} shirt={STAT_COLOR.dsa} />
            </div>
            <p className="text-[12px] text-muted">Final year. Unearned confidence.</p>
          </motion.div>
        </motion.div>
      </div>

      <footer className="border-t hairline bg-surface/60 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-3 text-[12px] tracking-[0.12em] uppercase text-muted">
          <span>90 days · as much as your energy allows · many bad decisions</span>
          {best.runs > 0 && (
            <span className="tnum">
              Best {best.bestSalary > 0 ? `₹${best.bestSalary} LPA` : `score ${best.bestScore}`} · {best.runs} run{best.runs === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </footer>
    </main>
  )
}
