import { motion } from 'framer-motion'
import { TOTAL_DAYS, getPhase } from '../data/phases'

export function DayProgress({ day }: { day: number }) {
  const pct = Math.round(((day - 1) / (TOTAL_DAYS - 1)) * 100)
  const phase = getPhase(day)
  const left = TOTAL_DAYS - day
  return (
    <div className="glass rounded-2xl p-3.5 sm:p-4">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-semibold tracking-wide uppercase text-muted">Placement Day</span>
        <span className="font-display font-bold" style={{ color: `rgb(${phase.glow})` }}>
          {left === 0 ? 'TODAY' : `${left} day${left === 1 ? '' : 's'} left`}
        </span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-white/8 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Season progress">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, rgb(${phase.glow}), #F472B6)` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          {phase.emoji} {phase.name}
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  )
}
