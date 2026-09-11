import { motion } from 'framer-motion'
import { BookOpen, Briefcase, Flame, GraduationCap, Timer, type LucideIcon } from 'lucide-react'
import { PHASES, TOTAL_DAYS, getPhase } from '../game/balance'
import { Mascot, type Mood } from './Mascot'
import { PHASE_THEME } from './theme'

const MILESTONE: Record<string, LucideIcon> = { prep: BookOpen, grind: Flame, season: Briefcase, final: Timer, day90: GraduationCap }

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

      {/* journey path */}
      <div className="mt-10 relative" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_DAYS} aria-valuenow={day} aria-label="Season progress">
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-line)' }}>
          {PHASES.slice(0, 4).map((p) => (
            <span key={p.id} className="absolute top-0 bottom-0 opacity-30" style={{ left: `${((p.from - 1) / (TOTAL_DAYS - 1)) * 100}%`, width: `${((p.to - p.from + 1) / (TOTAL_DAYS - 1)) * 100}%`, background: PHASE_THEME[p.id].accent }} aria-hidden />
          ))}
          <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: 'var(--phase-accent)' }} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        {PHASES.map((p) => {
          const I = MILESTONE[p.id]
          const x = ((p.from - 1) / (TOTAL_DAYS - 1)) * 100
          const reached = day >= p.from
          const th = PHASE_THEME[p.id]
          return (
            <span key={p.id} className="absolute -top-2.5 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-surface" style={{ left: `calc(${x}% - 14px)`, borderColor: reached ? th.accent : 'var(--color-line)', color: reached ? th.accent : 'var(--color-faint)' }} title={p.name} aria-hidden>
              <I size={13} strokeWidth={2.2} />
            </span>
          )
        })}
        <motion.span className="absolute -top-8 pointer-events-none" initial={false} animate={{ left: `calc(${pct}% - 14px)` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} aria-hidden>
          <svg width="28" height="30" viewBox="24 10 52 60">
            <rect x="26" y="22" width="48" height="52" rx="18" fill="#F2C7A5" />
            <path d="M26 42 C24 20 40 12 52 14 C66 15 76 22 74 40 C68 32 60 30 50 32 C42 33 34 34 26 42 Z" fill="#2B2320" />
            <ellipse cx="38.5" cy="50" rx="2.6" ry="3" fill="#2B2320" />
            <ellipse cx="61.5" cy="50" rx="2.6" ry="3" fill="#2B2320" />
            <path d="M42 64 Q50 70 58 64" stroke="#2B2320" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </svg>
        </motion.span>
        <div className="mt-4 hidden sm:grid grid-cols-4 text-[11px] tracking-[0.1em] uppercase">
          {PHASES.slice(0, 4).map((p) => (
            <span key={p.id} className={p.id === phase.id ? 'font-semibold' : 'text-faint'} style={p.id === phase.id ? { color: 'var(--phase-ink)' } : undefined}>
              {p.name}
            </span>
          ))}
        </div>
        <p className="mt-4 sm:hidden text-[11px] tracking-[0.1em] uppercase">
          <span className="font-semibold" style={{ color: 'var(--phase-ink)' }}>{phase.name}</span>
          {phase.id !== 'day90' && <span className="text-faint"> · {PHASES.findIndex((p) => p.id === phase.id) + 1} of 4</span>}
        </p>
      </div>
    </section>
  )
}
