import { useEffect, useMemo, useState } from 'react'

const COLORS = ['#7C5CFC', '#4ADE80', '#FBBF24', '#FB7185', '#38BDF8', '#F472B6']

/** Lightweight CSS confetti: renders ~60 pieces for 2.5s whenever `trigger` changes. */
export function Confetti({ trigger, reduced }: { trigger: number; reduced: boolean }) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (!trigger || reduced) return
    setActive(true)
    const t = window.setTimeout(() => setActive(false), 2600)
    return () => window.clearTimeout(t)
  }, [trigger, reduced])

  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: `${trigger}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        rot: Math.random() * 360,
      })),
    [trigger],
  )

  if (!active) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      <style>{`@keyframes confetti-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0.6 } }`}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}
