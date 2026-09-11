import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { Toast } from '../hooks/useGameState'

type Props = { toasts: Toast[]; onDismiss: (id: number) => void }

const STYLE: Record<Toast['kind'], string> = {
  achievement: 'border-warning/50 legendary-glow',
  info: 'border-sky/40',
  error: 'border-danger/50',
  saved: 'border-success/40',
}

export function AchievementToast({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed z-[60] top-3 right-3 left-3 sm:left-auto sm:w-80 flex flex-col gap-2" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`glass rounded-2xl p-3.5 flex gap-3 items-start border ${STYLE[t.kind]}`}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <motion.span
              className="text-2xl"
              aria-hidden
              animate={t.kind === 'achievement' ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.3, 1] } : undefined}
              transition={{ duration: 0.6 }}
            >
              {t.emoji ?? 'ℹ️'}
            </motion.span>
            <div className="flex-1 min-w-0">
              {t.kind === 'achievement' && <div className="text-[10px] uppercase tracking-widest text-warning font-bold">Achievement unlocked</div>}
              <div className="font-display font-bold text-sm">{t.title}</div>
              {t.body && <div className="text-xs text-muted mt-0.5">{t.body}</div>}
            </div>
            <button onClick={() => onDismiss(t.id)} className="focus-ring rounded-lg p-1 text-muted hover:text-text" aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
