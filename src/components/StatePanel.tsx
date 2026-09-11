import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Effects, GameState, StatKey } from '../types/game'
import { CORE_KEYS, PROGRESS_KEYS, STAT_LABEL } from '../game/balance'
import { toCgpa } from '../game/scoring'
import { Num, fmtDelta } from './ui'
import { STAT_COLOR } from './theme'
import { StatIcon } from './StatIcon'

function Row({ k, value, delta, peek }: { k: StatKey; value: number; delta?: number; peek?: number }) {
  const isCgpa = k === 'cgpa'
  const [flash, setFlash] = useState(0)
  useEffect(() => {
    if (delta !== undefined && Math.abs(delta) >= 0.05) setFlash((n) => n + 1)
  }, [delta, value])
  const shown = isCgpa ? toCgpa(value) : value
  const low = !isCgpa && value < 20
  const color = STAT_COLOR[k]
  return (
    <li className="py-2.5 border-b hairline last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`inline-flex items-center gap-2 text-[13px] ${low ? 'text-danger font-medium' : 'text-muted'}`}>
          <StatIcon k={k} value={value} delta={delta} />
          {STAT_LABEL[k]}{low ? ' · low' : ''}
        </span>
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
      <div key={flash} className={`mt-1.5 h-[5px] bg-line rounded-full overflow-hidden relative ${flash && delta && delta < 0 ? 'barshake' : ''}`} aria-hidden>
        {peek !== undefined && peek !== 0 && (
          <div className="absolute inset-y-0 rounded-full opacity-45" style={{ background: peek > 0 ? color : '#D95C5C', left: `${Math.min(value, Math.max(0, value + peek))}%`, width: `${Math.min(100, Math.abs(peek))}%` }} />
        )}
        <motion.div className="h-full rounded-full relative" style={{ background: color }} initial={false} animate={{ width: `${Math.max(2, value)}%` }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
          {flash > 0 && <span className="absolute inset-0 rounded-full bg-white flash" />}
        </motion.div>
      </div>
    </li>
  )
}

export function StatePanel({ state, deltas, peek }: { state: GameState; deltas: Effects; peek?: Effects | null }) {
  const career = PROGRESS_KEYS.filter((k) => state.revealed.includes(k as never))
  return (
    <section aria-label="Your state">
      <p className="eyebrow">Your state</p>
      <ul className="mt-2">
        {CORE_KEYS.map((k) => (
          <Row key={k} k={k} value={state.stats[k]} delta={deltas[k]} peek={peek?.[k]} />
        ))}
      </ul>
      {career.length > 0 && (
        <>
          <p className="eyebrow mt-6">Career</p>
          <ul className="mt-2">
            {career.map((k) => (
              <Row key={k} k={k} value={state.stats[k]} delta={deltas[k]} peek={peek?.[k]} />
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
            <p className={`serif text-[22px] leading-none tnum ${low ? 'text-danger' : ''}`} style={low ? undefined : { color: STAT_COLOR[k] }}>{isCgpa ? toCgpa(v).toFixed(1) : Math.round(v)}</p>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted mt-1 inline-flex items-center gap-1"><StatIcon k={k} value={v} size={11} />{STAT_LABEL[k]}</p>
          </div>
        )
      })}
    </div>
  )
}
