import { useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const DEFAULT_COLORS = ['#FFB020', '#6C7BFF', '#8B5CF6', '#3DBE7A', '#FF6B8A', '#22B8CF']

/**
 * Lightweight confetti. `trigger` changes fire a burst; `amount` 0–1 scales piece count (cap 80).
 * Pure CSS transforms; nothing runs under reduced motion.
 */
export function Confetti({ trigger, amount = 0.6, colors = DEFAULT_COLORS, origin = 'top' }: { trigger: number; amount?: number; colors?: string[]; origin?: 'top' | 'center' }) {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (!trigger || reduced || amount <= 0) return
    setActive(true)
    const t = window.setTimeout(() => setActive(false), 2400)
    return () => window.clearTimeout(t)
  }, [trigger, reduced, amount])

  const pieces = useMemo(() => {
    const n = Math.min(80, Math.round(80 * amount))
    return Array.from({ length: n }, (_, i) => ({
      id: `${trigger}-${i}`,
      left: origin === 'center' ? 35 + Math.random() * 30 : Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.6 + Math.random() * 1,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 6,
      rot: Math.random() * 360,
      drift: (Math.random() - 0.5) * 40,
    }))
  }, [trigger, amount, colors, origin])

  if (!active) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      <style>{`@keyframes confetti-fall { 0% { transform: translate3d(0,-10vh,0) rotate(0deg); opacity: 1 } 100% { transform: translate3d(var(--drift),110vh,0) rotate(720deg); opacity: 0.7 } }`}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute', top: 0, left: `${p.left}%`, width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 2,
            transform: `rotate(${p.rot}deg)`, animation: `confetti-fall ${p.dur}s ${p.delay}s cubic-bezier(.2,.6,.4,1) forwards`, ['--drift' as string]: `${p.drift}px`, willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

/** Sparkle field for legendary moments. */
export function Sparkles({ trigger, color = '#F5C542' }: { trigger: number; color?: string }) {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (!trigger || reduced) return
    setActive(true)
    const t = window.setTimeout(() => setActive(false), 2600)
    return () => window.clearTimeout(t)
  }, [trigger, reduced])
  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ id: `${trigger}-${i}`, x: Math.random() * 100, y: Math.random() * 100, d: Math.random() * 1.6, s: 4 + Math.random() * 8 })), [trigger])
  if (!active) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[69]" aria-hidden>
      <style>{`@keyframes sparkle { 0%{transform:scale(0) rotate(0);opacity:0} 40%{transform:scale(1) rotate(45deg);opacity:1} 100%{transform:scale(0) rotate(90deg);opacity:0} }`}</style>
      {stars.map((s) => (
        <span key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, background: color, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', animation: `sparkle 1.4s ${s.d}s ease-out forwards` }} />
      ))}
    </div>
  )
}

/** Full-screen colour flash. */
export function Flash({ trigger, color }: { trigger: number; color: string }) {
  const reduced = useReducedMotion()
  if (!trigger || reduced) return null
  return <div key={trigger} className="pointer-events-none fixed inset-0 z-[68] flash" style={{ background: color }} aria-hidden />
}
