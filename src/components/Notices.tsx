import { AnimatePresence, motion } from 'framer-motion'
import type { Notice } from '../hooks/useGame'

export function Notices({ items, onDismiss }: { items: Notice[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-80 flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((n) => (
          <motion.button
            key={n.id}
            onClick={() => onDismiss(n.id)}
            className={`pointer-events-auto text-left bg-surface border hairline rounded-md px-4 py-3 shadow-[0_12px_30px_-18px_rgba(23,23,23,0.35)] ${n.kind === 'achievement' ? 'border-l-4 border-l-lime' : n.kind === 'error' ? 'border-l-4 border-l-danger' : ''}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.22 }}
            aria-label={`${n.title}. Dismiss`}
          >
            {n.kind === 'achievement' && <p className="eyebrow text-[10px]">Unlocked</p>}
            <p className="font-semibold text-[14px]">{n.title}</p>
            {n.body && <p className="text-[12px] text-muted mt-0.5">{n.body}</p>}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
