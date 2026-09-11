import { motion } from 'framer-motion'
import { PHASES, TOTAL_DAYS, getPhase } from '../game/balance'

export function DayHero({ day }: { day: number }) {
  const phase = getPhase(day)
  const left = TOTAL_DAYS - day
  const pct = ((day - 1) / (TOTAL_DAYS - 1)) * 100
  return (
    <section aria-label={`Day ${day} of ${TOTAL_DAYS}`}>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Day</p>
          <div className="flex items-baseline gap-3">
            <motion.span
              key={day}
              className="serif text-[88px] sm:text-[120px] leading-[0.85] tnum"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {day}
            </motion.span>
            <span className="text-muted text-sm sm:text-base tracking-[0.12em] uppercase">of {TOTAL_DAYS}</span>
          </div>
        </div>
        <div className="text-right pb-2">
          <p className="serif text-2xl sm:text-3xl tnum leading-none">{left === 0 ? 'Today' : left}</p>
          <p className="eyebrow mt-1.5">{left === 0 ? 'Placement day' : left === 1 ? 'day until placement' : 'days until placement'}</p>
        </div>
      </div>

      <div className="mt-6" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_DAYS} aria-valuenow={day} aria-label="Season progress">
        <div className="relative h-px bg-line">
          <motion.div className="absolute left-0 top-0 h-px bg-ink" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
          <motion.div
            className="absolute -top-[4px] w-[9px] h-[9px] rounded-full bg-ink ring-4 ring-paper"
            initial={false} animate={{ left: `calc(${pct}% - 4px)` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="mt-3 grid grid-cols-4 text-[11px] tracking-[0.1em] uppercase">
          {PHASES.slice(0, 4).map((p) => (
            <span key={p.id} className={p.id === phase.id ? 'text-ink font-semibold' : 'text-faint'}>
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
