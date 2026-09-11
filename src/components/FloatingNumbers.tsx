import { AnimatePresence, motion } from 'framer-motion'
import type { FloatingDelta } from '../types/game'
import { STAT_META } from '../utils/gameLogic'

export function FloatingNumbers({ items }: { items: FloatingDelta[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 sm:top-28 z-40 flex flex-col items-center gap-1" aria-hidden>
      <AnimatePresence>
        {items.map((f, i) => {
          const meta = STAT_META[f.key]
          const v = f.key === 'cgpa' ? (f.delta / 20).toFixed(2) : String(Math.round(f.delta * 10) / 10)
          const pos = f.delta > 0
          return (
            <motion.div
              key={f.id}
              className={`font-display font-bold text-base sm:text-lg px-3 py-1 rounded-full glass ${pos ? 'text-success' : 'text-danger'}`}
              initial={{ opacity: 0, y: 10, scale: 0.8, x: (i % 3 - 1) * 60 }}
              animate={{ opacity: 1, y: -30 - i * 4, scale: 1 }}
              exit={{ opacity: 0, y: -70 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              {pos ? '+' : ''}
              {v} {meta.emoji}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
