import { motion } from 'framer-motion'
import { Check, Target } from 'lucide-react'
import type { GameState } from '../types/game'
import { GOLD, STAT_COLOR, alpha } from './theme'
import { toCgpa } from '../game/scoring'
import { Mascot } from './Mascot'
import { Sheet } from './ui'

const fmt = (g: GameState['week']['goals'][number]) => {
  if (g.kind === 'stat' && g.key === 'cgpa') return `${toCgpa(g.progress).toFixed(1)} / ${toCgpa(g.target).toFixed(1)}`
  return `${Math.min(g.target, Math.round(g.progress))} / ${g.target}`
}

export function WeekPanel({ state }: { state: GameState }) {
  const w = state.week
  if (!w.goals.length) return null
  const weekNo = Math.floor((w.start - 1) / 7) + 1
  const doneCount = w.goals.filter((g) => g.done).length
  const daysLeft = Math.max(0, w.start + 6 - state.day)
  return (
    <section aria-label="This week's goals" className="panel p-5" style={w.cleared ? { borderColor: GOLD, boxShadow: `0 0 0 3px ${alpha(GOLD, 0.3)}` } : undefined}>
      <div className="flex items-baseline justify-between">
        <p className="eyebrow eyebrow-dot">Week {weekNo} goals</p>
        <span className="text-[11px] text-muted tnum">{w.cleared ? 'Cleared' : `${daysLeft === 0 ? 'last day' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}`}</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {w.goals.map((g) => {
          const pct = Math.min(100, (g.progress / Math.max(1, g.target)) * 100)
          const color = g.kind === 'stat' ? STAT_COLOR[g.key as keyof typeof STAT_COLOR] ?? STAT_COLOR.dsa : g.kind === 'skill' ? STAT_COLOR.dsa : g.kind === 'apply' ? GOLD : STAT_COLOR.wellbeing
          return (
            <li key={g.id} className="flex items-center gap-3">
              <motion.span
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-white"
                style={{ borderColor: color, background: g.done ? color : 'transparent' }}
                initial={false}
                animate={{ scale: g.done ? [1, 1.25, 1] : 1 }}
                aria-hidden
              >
                {g.done ? <Check size={13} strokeWidth={3} /> : <Target size={12} strokeWidth={2.2} style={{ color }} />}
              </motion.span>
              <span className="flex-1 min-w-0">
                <span className={`block text-[14px] font-semibold ${g.done ? 'line-through decoration-2' : ''}`} style={g.done ? { textDecorationColor: color } : undefined}>{g.label}</span>
                <span className="block h-[5px] rounded-full mt-1.5 overflow-hidden" style={{ background: alpha(color, 0.18) }} aria-hidden>
                  <motion.span className="block h-full rounded-full" style={{ background: color }} initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 170, damping: 22 }} />
                </span>
              </span>
              <span className="text-[12px] tnum text-muted shrink-0">{fmt(g)}</span>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] text-faint">{doneCount}/3 done · clear all three for a small bonus.</p>
    </section>
  )
}

export function WeekClearSheet({ state, onClose }: { state: GameState; onClose: () => void }) {
  const w = state.week
  const open = w.cleared && !w.celebrated
  const weekNo = Math.floor((w.start - 1) / 7) + 1
  return (
    <Sheet open={open} onClose={onClose} label="Week cleared" width="max-w-md" accent={GOLD} wash={alpha(GOLD, 0.3)}>
      <div className="p-8 text-center">
        <div className="flex justify-center"><Mascot mood="celebrate" size={120} shirt={GOLD} /></div>
        <p className="eyebrow mt-2">Week {weekNo}</p>
        <p className="serif text-[40px] leading-none mt-2">All three<span className="px-1" style={{ background: alpha(GOLD, 0.6) }}>.</span></p>
        <ul className="mt-6 text-left space-y-2">
          {w.goals.map((g) => (
            <li key={g.id} className="flex items-center gap-3 text-[15px]">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: GOLD }}><Check size={13} strokeWidth={3} color="#3B2A00" /></span>
              <span className="line-through decoration-2" style={{ textDecorationColor: GOLD }}>{g.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[14px] text-muted">+6 Wellbeing · +8 Motivation · +2 Luck. Small bonus, big smugness.</p>
        <button onClick={onClose} className="btn btn-primary press mt-6 w-full">Nice. Next week.</button>
      </div>
    </Sheet>
  )
}
