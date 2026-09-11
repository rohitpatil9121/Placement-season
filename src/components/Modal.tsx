import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
  labelledBy?: string
  dismissable?: boolean
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl' }

export function Modal({ open, onClose, title, children, size = 'md', className = '', labelledBy, dismissable = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const focusable = el?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
    focusable?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable && onClose) onClose()
      if (e.key === 'Tab' && el) {
        const items = Array.from(el.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')).filter(
          (x) => !x.hasAttribute('disabled'),
        )
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose, dismissable])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            aria-label="Close dialog"
            tabIndex={-1}
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: 'blur(6px)' }}
            onClick={dismissable ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : title}
            className={`glass relative w-full ${sizes[size]} rounded-3xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto ${className}`}
            initial={{ opacity: 0, scale: 0.92, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 12, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h2 id={labelledBy} className="font-display text-xl sm:text-2xl font-bold">
                  {title}
                </h2>
                {dismissable && onClose && (
                  <button
                    onClick={onClose}
                    className="focus-ring rounded-xl p-2 text-muted hover:text-text hover:bg-white/5 min-w-11 min-h-11 flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
