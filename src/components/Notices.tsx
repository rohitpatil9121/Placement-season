import { AnimatePresence, motion } from 'framer-motion'
import type { Notice } from '../hooks/useGame'
import { Medal } from 'lucide-react'
import { GOLD } from './theme'

export function Notices({ items, onDismiss }: { items: Notice[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-80 flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((n) => (
          <motion.button
            key={n.id}
            onClick={() => onDismiss(n.id)}
            className={`pointer-events-auto text-left bg-surface border hairline rounded-[14px] px-4 py-3 shadow-[0_12px_30px_-18px_rgba(23,23,23,0.35)] flex items-center gap-3 relative overflow-hidden ${n.kind === 'error' ? 'border-l-4 border-l-danger' : ''}`}
            initial={{ opacity: 0, y: n.kind === 'achievement' ? -16 : 10, scale: n.kind === 'achievement' ? 0.9 : 1 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            aria-label={`${n.title}. Dismiss`}
          >
            {n.kind === 'achievement' && (
              <>
                <span className="absolute inset-0 shimmer pointer-events-none" aria-hidden />
                <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: GOLD, boxShadow: `0 0 0 3px #fff, 0 0 0 5px ${GOLD}` }} aria-hidden>
                  <Medal size={20} strokeWidth={2} color="#3B2A00" />
                </span>
              </>
            )}
            <span className="min-w-0">
              {n.kind === 'achievement' && <p className="eyebrow text-[10px]" style={{ color: '#9A6B00' }}>Achievement unlocked</p>}
              <p className="font-semibold text-[14px]">{n.title}</p>
              {n.body && <p className="text-[12px] text-muted mt-0.5">{n.body}</p>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
