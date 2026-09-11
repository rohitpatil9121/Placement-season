import { motion } from 'framer-motion'
import { PHASES, TOTAL_DAYS, getPhase } from '../game/balance'
import { Mascot, type Mood } from './Mascot'

export function DayHero({ day, mood, bump }: { day: number; mood: Mood; bump: number }) {
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
              style={{ color: 'var(--phase-ink)' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {day}
            </motion.span>
            <span className="text-muted text-sm sm:text-base tracking-[0.12em] uppercase">of {TOTAL_DAYS}</span>
          </div>
        </div>
        <div className="hidden lg:block -mb-3"><Mascot mood={mood} bump={bump} size={120} /></div>
        <div className="text-right pb-2">
          <p className="serif text-2xl sm:text-3xl tnum leading-none" style={{ color: 'var(--phase-ink)' }}>{left === 0 ? 'Today' : left}</p>
          <p className="eyebrow mt-1.5">{left === 0 ? 'Placement day' : left === 1 ? 'day until placement' : 'days until placement'}</p>
        </div>
      </div>

      <div className="mt-6" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_DAYS} aria-valuenow={day} aria-label="Season progress">
        <div className="relative h-px bg-line">
          <motion.div className="absolute left-0 top-0 h-px" style={{ background: 'var(--phase-accent)' }} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
          <motion.div
            className="absolute -top-[4px] w-[9px] h-[9px] rounded-full ring-4 ring-paper"
            style={{ background: 'var(--phase-accent)' }}
            initial={false} animate={{ left: `calc(${pct}% - 4px)` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="mt-3 hidden sm:grid grid-cols-4 text-[11px] tracking-[0.1em] uppercase">
          {PHASES.slice(0, 4).map((p) => (
            <span key={p.id} className={p.id === phase.id ? 'font-semibold' : 'text-faint'} style={p.id === phase.id ? { color: 'var(--phase-ink)' } : undefined}>
              {p.name}
            </span>
          ))}
        </div>
        <p className="mt-3 sm:hidden text-[11px] tracking-[0.1em] uppercase">
          <span className="text-ink font-semibold">{phase.name}</span>
          {phase.id !== 'day90' && <span className="text-faint"> · {PHASES.findIndex((p) => p.id === phase.id) + 1} of 4</span>}
        </p>
      </div>
    </section>
  )
}
