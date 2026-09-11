import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, BookOpen, Code, Coffee, CupSoda, FileText, GraduationCap, Hammer, Mic, Moon, Send, Sofa, Users, X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import type { Effects, StatKey } from '../types/game'
import { STAT_LABEL } from '../game/balance'

export const ICONS: Record<string, LucideIcon> = {
  code: Code, 'book-open': BookOpen, hammer: Hammer, moon: Moon, mic: Mic, 'file-text': FileText, users: Users,
  coffee: Coffee, 'graduation-cap': GraduationCap, send: Send, 'cup-soda': CupSoda, sofa: Sofa, arrow: ArrowRight,
}

export function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? ArrowRight
  return <C size={size} strokeWidth={1.75} className={className} aria-hidden />
}

export const fmtDelta = (k: StatKey, v: number) => {
  const val = k === 'cgpa' ? (v / 20).toFixed(2) : String(Math.round(v * 10) / 10)
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${val.replace('-', '')}`
}

/** Inline consequence chips: "+6 DSA  −12 Energy" */
export function EffectList({ effects, size = 'sm', className = '' }: { effects: Effects; size?: 'sm' | 'md'; className?: string }) {
  const entries = (Object.entries(effects) as [StatKey, number][]).filter(([, v]) => v && Math.abs(v) >= 0.05)
  if (!entries.length) return null
  return (
    <span className={`inline-flex flex-wrap gap-x-3 gap-y-1 tnum ${size === 'sm' ? 'text-[13px]' : 'text-[15px]'} ${className}`}>
      {entries.map(([k, v]) => (
        <span key={k} className={v > 0 ? 'text-success' : 'text-danger'}>
          <span className="font-semibold">{fmtDelta(k, v)}</span> <span className="text-muted">{STAT_LABEL[k]}</span>
        </span>
      ))}
    </span>
  )
}

/** Overlay sheet with focus trap and Esc handling. Dims the game behind for important content. */
export function Sheet({
  open, children, onClose, dim = true, width = 'max-w-lg', label, wash, accent,
}: { open: boolean; children: ReactNode; onClose?: () => void; dim?: boolean; width?: string; label: string; wash?: string; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const q = () => Array.from(el?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])') ?? [])
    window.setTimeout(() => q()[0]?.focus(), 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose()
      if (e.key === 'Tab') {
        const items = q()
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])

  if (reduced) {
    if (!open) return null
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
        <button aria-label="Close" tabIndex={-1} className={`absolute inset-0 ${dim ? 'bg-ink/45' : 'bg-ink/10'}`} style={wash ? { background: wash } : undefined} onClick={onClose} />
        <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={`relative w-full ${width} bg-surface border hairline sm:rounded-[18px] rounded-t-[18px] max-h-[92dvh] overflow-y-auto`} style={accent ? { borderTop: `4px solid ${accent}` } : undefined}>
          {onClose && (
            <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 w-11 h-11 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-paper">
              <X size={18} strokeWidth={1.75} />
            </button>
          )}
          {children}
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        >
          <motion.button
            aria-label="Close" tabIndex={-1}
            className={`absolute inset-0 ${dim ? 'bg-ink/45' : 'bg-ink/10'}`}
            style={wash ? { background: wash } : undefined}
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            ref={ref} role="dialog" aria-modal="true" aria-label={label}
            className={`relative w-full ${width} bg-surface border hairline sm:rounded-[18px] rounded-t-[18px] max-h-[92dvh] overflow-y-auto shadow-[0_24px_60px_-30px_rgba(23,23,23,0.35)]`}
            style={accent ? { borderTop: `4px solid ${accent}` } : undefined}
            initial={{ opacity: 0, y: wash ? 40 : 24, scale: wash ? 0.97 : 1 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: wash ? 0.45 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {onClose && (
              <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 w-11 h-11 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-paper press">
                <X size={18} strokeWidth={1.75} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Smoothly interpolated number. */
export function Num({ value, decimals = 0, className = '' }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(value)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = from.current
    const end = value
    if (start === end) { el.textContent = end.toFixed(decimals); return }
    const reduced = document.documentElement.getAttribute('data-reduced-motion') === 'true'
    if (reduced) { el.textContent = end.toFixed(decimals); from.current = end; return }
    const t0 = performance.now()
    const dur = 420
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      el.textContent = (start + (end - start) * e).toFixed(decimals)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = end
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, decimals])
  return <span ref={ref} className={`tnum ${className}`}>{value.toFixed(decimals)}</span>
}

export function Hairline({ className = '' }: { className?: string }) {
  return <div className={`border-t hairline ${className}`} aria-hidden />
}
