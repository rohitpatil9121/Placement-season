import { motion } from 'framer-motion'

type Props = {
  value: number
  max?: number
  color: string
  label: string
  height?: number
}

export function StatBar({ value, max = 100, color, label, height = 10 }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className="w-full rounded-full bg-white/8 overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 12px ${color}66` }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}
