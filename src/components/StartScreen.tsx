import { motion } from 'framer-motion'
import type { BestRuns, GameState } from '../types/game'

type Props = {
  saved: GameState | null
  best: BestRuns
  corrupted: boolean
  onStart: () => void
  onContinue: () => void
  onSettings: () => void
}

export function StartScreen({ saved, best, corrupted, onStart, onContinue, onSettings }: Props) {
  const inProgress = saved && saved.status !== 'finished'
  return (
    <main className="min-h-dvh flex flex-col">
      <div className="flex-1 flex items-center">
        <motion.div
          className="w-full max-w-5xl mx-auto px-6 sm:px-10 py-16"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow">90 days before placement</p>
          <h1 className="serif text-[64px] sm:text-[112px] lg:text-[136px] leading-[0.92] mt-5 -ml-1">
            Placement
            <br />
            Season
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-muted max-w-md">One decision at a time. How badly can this go?</p>

          {corrupted && (
            <div className="mt-8 max-w-md border hairline rounded-md p-4 bg-surface text-sm">
              <p className="font-semibold">Your save file had a placement-related incident.</p>
              <p className="text-muted mt-1">It could not be read, so it was set aside. Start fresh below.</p>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {inProgress ? (
              <>
                <button onClick={onContinue} className="btn btn-primary press">Continue · Day {saved.day}</button>
                <button onClick={onStart} className="btn btn-ghost press">New game</button>
              </>
            ) : (
              <>
                <button onClick={onStart} className="btn btn-primary press">Start</button>
                {saved?.status === 'finished' && <button onClick={onContinue} className="btn btn-ghost press">Last result</button>}
              </>
            )}
            <button onClick={onSettings} className="btn press text-muted hover:text-ink">Settings</button>
          </div>
        </motion.div>
      </div>

      <footer className="border-t hairline">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-3 text-[12px] tracking-[0.12em] uppercase text-muted">
          <span>90 days · 3 actions / day · many bad decisions</span>
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
