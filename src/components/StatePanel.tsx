import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Effects, GameState, StatKey } from '../types/game'
import { CORE_KEYS, PROGRESS_KEYS, STAT_LABEL } from '../game/balance'
import { toCgpa } from '../game/scoring'
import { Num, fmtDelta } from './ui'
import { STAT_COLOR } from './theme'
import { StatIcon } from './StatIcon'
import { MOOD_LINE, moodFor } from './Mascot'

export function vibeFor(state: GameState): string {
  const s = state.stats
  if (s.dsa > 85 && s.cgpa > 70) return 'Annoyingly competent.'
  if (s.energy < 15 && s.sleep < 30) return 'Running on chai and hope.'
  if (s.sleep > 85 && s.wellbeing > 80) return 'Suspiciously well-rested.'
  if (s.wellbeing < 25) return 'One LinkedIn post from crying.'
  if (state.metrics.offers > 0) return 'Screenshot. Send to family.'
  if (s.dsa < 35 && state.day > 40) return 'Two Sum is still hard.'
  return MOOD_LINE[moodFor(s)]
}

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
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-2.5 text-[15px] font-semibold ${low ? 'text-danger' : 'text-ink'}`}>
          <span className="pill-icon" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}><StatIcon k={k} value={value} delta={delta} size={15} /></span>
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
          <Num value={shown} decimals={isCgpa ? 1 : 0} className="serif text-[28px] leading-none" />
        </span>
      </div>
      <div key={flash} className={`mt-2 h-[9px] rounded-full overflow-hidden relative ${flash && delta && delta < 0 ? 'barshake' : ''}`} style={{ background: `color-mix(in srgb, ${color} 14%, var(--color-line))` }} aria-hidden>
        {peek !== undefined && peek !== 0 && (
          <div className="absolute inset-y-0 rounded-full opacity-45" style={{ background: peek > 0 ? color : '#D95C5C', left: `${Math.min(value, Math.max(0, value + peek))}%`, width: `${Math.min(100, Math.abs(peek))}%` }} />
        )}
        <motion.div className="h-full rounded-full relative" style={{ background: color, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.15)' }} initial={false} animate={{ width: `${Math.max(2, value)}%` }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
          {flash > 0 && <span className="absolute inset-0 rounded-full bg-white flash" />}
        </motion.div>
      </div>
    </li>
  )
}

export function StatePanel({ state, deltas, peek }: { state: GameState; deltas: Effects; peek?: Effects | null }) {
  const career = PROGRESS_KEYS.filter((k) => state.revealed.includes(k as never))
  return (
    <section aria-label="Your state" className="panel p-5">
      <p className="eyebrow eyebrow-dot">Your state</p>
      <p className="serif text-[26px] leading-tight mt-1" aria-live="polite">{vibeFor(state)}</p>
      <ul className="mt-3">
        {CORE_KEYS.filter((k) => k !== 'energy').map((k) => (
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
    <div className="grid grid-cols-4 border-y hairline py-3" aria-label="Your state, summary">
      {CORE_KEYS.filter((k) => k !== 'energy').map((k) => {
        const isCgpa = k === 'cgpa'
        const v = state.stats[k]
        const low = !isCgpa && v < 20
        return (
          <div key={k} className="text-center">
            <p className={`serif text-[26px] leading-none tnum ${low ? 'text-danger' : ''}`} style={low ? undefined : { color: STAT_COLOR[k] }}>{isCgpa ? toCgpa(v).toFixed(1) : Math.round(v)}</p>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted mt-1 inline-flex items-center gap-1"><StatIcon k={k} value={v} size={11} />{STAT_LABEL[k]}</p>
          </div>
        )
      })}
    </div>
  )
}
