import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Effects, StatKey } from '../types/game'
import { STAT_LABEL } from '../game/balance'
import { STAT_COLOR } from './theme'
import { fmtDelta } from './ui'

type Pill = { id: string; k: StatKey; v: number }

/** Coloured pills that pop up from an anchor and drift away, one per changed stat, staggered 60 ms. */
export function FloatingDeltas({ deltas, nonce }: { deltas: Effects; nonce: number }) {
  const reduced = useReducedMotion()
  const [pills, setPills] = useState<Pill[]>([])
  useEffect(() => {
    if (!nonce || reduced) return
    const items = (Object.entries(deltas) as [StatKey, number][])
      .filter(([k, v]) => k !== 'energy' && v && Math.abs(v) >= 0.05)
      .slice(0, 6)
      .map(([k, v], i) => ({ id: `${nonce}-${k}-${i}`, k, v }))
    if (!items.length) return
    setPills((p) => [...p, ...items])
    const t = window.setTimeout(() => setPills((p) => p.filter((x) => !items.includes(x))), 1500)
    return () => window.clearTimeout(t)
  }, [deltas, nonce, reduced])

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20 flex flex-col items-end gap-1" aria-hidden>
      <AnimatePresence>
        {pills.map((p, i) => (
          <motion.span
            key={p.id}
            className="text-[12px] font-bold text-white rounded-full px-2.5 py-1 shadow-sm tnum whitespace-nowrap"
            style={{ background: STAT_COLOR[p.k] }}
            initial={{ opacity: 0, y: 8, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], y: [8, -6, -22, -40], scale: [0.7, 1.05, 1, 0.95] }}
            transition={{ duration: 1.3, delay: (i % 6) * 0.06, ease: 'easeOut' }}
          >
            {fmtDelta(p.k, p.v)} {STAT_LABEL[p.k]}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
