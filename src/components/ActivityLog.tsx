import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ScrollText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '../types/game'

type Props = { log: LogEntry[]; day: number }

const KIND_STYLE: Record<LogEntry['kind'], string> = {
  action: 'text-text',
  event: 'text-warning',
  system: 'text-muted',
  achievement: 'text-success',
}

export function ActivityLog({ log, day }: Props) {
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const recent = log.slice(-40)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log.length, open])

  return (
    <section className="glass rounded-2xl flex flex-col lg:h-full" aria-label="Activity log">
      <button
        className="focus-ring flex items-center justify-between w-full p-4 lg:cursor-default min-h-12"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="activity-log-list"
      >
        <span className="flex items-center gap-2 font-display font-bold">
          <ScrollText size={18} className="text-primary" /> Activity Log
        </span>
        <ChevronDown size={18} className={`lg:hidden transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <ul
        id="activity-log-list"
        ref={listRef}
        className={`px-4 pb-4 space-y-1.5 overflow-y-auto text-sm lg:block lg:flex-1 lg:max-h-[420px] max-h-64 ${open ? 'block' : 'hidden'}`}
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {recent.map((e) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-2 leading-snug ${e.day === day ? '' : 'opacity-55'} ${KIND_STYLE[e.kind]}`}
            >
              <span className="text-[10px] text-muted mt-1 w-[54px] shrink-0 font-mono">{e.time}</span>
              <span className="shrink-0" aria-hidden>
                {e.emoji}
              </span>
              <span className="text-[13px]">{e.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  )
}
