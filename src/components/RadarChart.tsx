import { motion } from 'framer-motion'

export type RadarAxis = { label: string; value: number; emoji: string }

export function RadarChart({ axes, color = '#7C5CFC', size = 260 }: { axes: RadarAxis[]; color?: string; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 34
  const n = axes.length
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i: number, v: number) => [cx + Math.cos(angle(i)) * r * v, cy + Math.sin(angle(i)) * r * v] as const
  const poly = axes.map((a, i) => pt(i, Math.max(0.04, a.value / 100)).join(',')).join(' ')
  const rings = [0.25, 0.5, 0.75, 1]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={axes.map((a) => `${a.label} ${Math.round(a.value)}`).join(', ')}>
      {rings.map((rr) => (
        <polygon key={rr} points={axes.map((_, i) => pt(i, rr).join(',')).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" />
      })}
      <motion.polygon
        points={poly}
        fill={`${color}44`}
        stroke={color}
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.3 }}
      />
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.2)
        return (
          <text key={a.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize={11} fontWeight={600}>
            {a.emoji} {a.label}
          </text>
        )
      })}
    </svg>
  )
}
