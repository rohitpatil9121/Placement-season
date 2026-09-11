import { AnimatePresence, motion } from 'framer-motion'
import type { LogEntry } from '../types/game'

const TONE: Record<LogEntry['kind'], string> = {
  action: 'text-ink', event: 'text-ink', system: 'text-muted', company: 'text-ink', achievement: 'text-success',
}

export function Recent({ log, day }: { log: LogEntry[]; day: number }) {
  const items = log.filter((e) => e.day >= day - 1).slice(-8).reverse()
  return (
    <section aria-label="Recently" aria-live="polite">
      <p className="eyebrow">Recently</p>
      {items.length <= 1 ? (
        <p className="mt-3 text-[13px] text-muted leading-relaxed">Nothing has happened yet. Give it five minutes.</p>
      ) : (
        <ul className="mt-2">
          <AnimatePresence initial={false}>
            {items.map((e) => (
              <motion.li
                key={e.id}
                className={`flex gap-3 py-2 border-b hairline last:border-b-0 text-[13px] leading-snug ${TONE[e.kind]} ${e.day < day ? 'opacity-50' : ''}`}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              >
                <span className="text-faint tnum shrink-0 w-10">{e.time}</span>
                <span>{e.text}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
