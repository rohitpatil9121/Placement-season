import { motion } from 'framer-motion'
import type { Effects, GameState, StatKey } from '../types/game'
import { CORE_KEYS, PROGRESS_KEYS, STAT_LABEL } from '../game/balance'
import { toCgpa } from '../game/scoring'
import { Num, fmtDelta } from './ui'

function Row({ k, value, delta }: { k: StatKey; value: number; delta?: number }) {
  const isCgpa = k === 'cgpa'
  const shown = isCgpa ? toCgpa(value) : value
  const low = !isCgpa && value < 20
  const tone = low ? 'bg-danger' : k === 'wellbeing' && value > 85 ? 'bg-success' : 'bg-ink'
  return (
    <li className="py-2.5 border-b hairline last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-[13px] ${low ? 'text-danger font-medium' : 'text-muted'}`}>{STAT_LABEL[k]}{low ? ' · low' : ''}</span>
        <span className="flex items-baseline gap-2">
          {delta !== undefined && Math.abs(delta) >= 0.05 && (
            <motion.span
              key={`${k}-${delta}`}
              className={`text-[11px] font-semibold tnum ${delta > 0 ? 'text-success' : 'text-danger'}`}
              initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
            >
              {fmtDelta(k, delta)}
            </motion.span>
          )}
          <Num value={shown} decimals={isCgpa ? 1 : 0} className="font-semibold text-[15px]" />
        </span>
      </div>
      <div className="mt-1.5 h-[3px] bg-line rounded-full overflow-hidden" aria-hidden>
        <motion.div className={`h-full rounded-full ${tone}`} initial={false} animate={{ width: `${Math.max(2, value)}%` }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </li>
  )
}

export function StatePanel({ state, deltas }: { state: GameState; deltas: Effects }) {
  const career = PROGRESS_KEYS.filter((k) => state.revealed.includes(k as never))
  return (
    <section aria-label="Your state">
      <p className="eyebrow">Your state</p>
      <ul className="mt-2">
        {CORE_KEYS.map((k) => (
          <Row key={k} k={k} value={state.stats[k]} delta={deltas[k]} />
        ))}
      </ul>
      {career.length > 0 && (
        <>
          <p className="eyebrow mt-6">Career</p>
          <ul className="mt-2">
            {career.map((k) => (
              <Row key={k} k={k} value={state.stats[k]} delta={deltas[k]} />
            ))}
          </ul>
        </>
      )}
      {career.length === 0 && state.day > 1 && (
        <p className="mt-5 text-[12px] text-faint leading-relaxed">Career stats appear once you start working on them.</p>
      )}
    </section>
  )
}

/** Compact five-stat strip for narrow screens; the full panel sits below the actions. */
export function StateStrip({ state }: { state: GameState }) {
  return (
    <div className="grid grid-cols-5 border-y hairline py-3" aria-label="Your state, summary">
      {CORE_KEYS.map((k) => {
        const isCgpa = k === 'cgpa'
        const v = state.stats[k]
        const low = !isCgpa && v < 20
        return (
          <div key={k} className="text-center">
            <p className={`serif text-[22px] leading-none tnum ${low ? 'text-danger' : ''}`}>{isCgpa ? toCgpa(v).toFixed(1) : Math.round(v)}</p>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted mt-1">{STAT_LABEL[k]}</p>
          </div>
        )
      })}
    </div>
  )
}
