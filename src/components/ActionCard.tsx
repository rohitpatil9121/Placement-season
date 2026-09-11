import { motion } from 'framer-motion'
import type { Action, AllStatKey } from '../types/game'
import { STAT_META } from '../utils/gameLogic'

type Props = {
  action: Action
  disabled: boolean
  reason?: string
  usedToday: number
  onClick: () => void
}

const TAG_COLORS: Record<Action['tag'], string> = {
  career: '#7C5CFC',
  academics: '#4ADE80',
  rest: '#38BDF8',
  social: '#F472B6',
  chaos: '#FB7185',
}

function fmtEffect(key: AllStatKey, v: number) {
  const meta = STAT_META[key]
  const val = key === 'cgpa' ? (v / 20).toFixed(2) : String(Math.round(v))
  return `${v > 0 ? '+' : ''}${val} ${meta.emoji}`
}

export function ActionCard({ action, disabled, reason, usedToday, onClick }: Props) {
  const color = TAG_COLORS[action.tag]
  const effects = (Object.entries(action.effects) as [AllStatKey, number][]).filter(([k]) => !STAT_META[k].hidden || k === 'projects' || k === 'interview' || k === 'resume' || k === 'networking' || k === 'applications' || k === 'attendance')
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled && reason ? reason : action.description}
      className={`focus-ring glass group text-left rounded-2xl p-3 sm:p-3.5 min-h-[92px] w-full relative overflow-hidden transition-colors ${
        disabled ? 'opacity-45 saturate-50' : 'hover:border-white/20'
      }`}
      whileHover={disabled ? undefined : { y: -3, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
    >
      <span className="absolute inset-x-0 top-0 h-0.5 opacity-70" style={{ background: color }} aria-hidden />
      <div className="flex items-start gap-2.5">
        <span className="text-2xl leading-none mt-0.5" aria-hidden>
          {action.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display font-bold text-sm sm:text-[15px] truncate">{action.name}</span>
            <span className="text-[10px] font-bold text-muted whitespace-nowrap" aria-label={`${action.cost} action point${action.cost === 1 ? '' : 's'}`}>
              {action.cost === 0 ? 'FREE' : '●'.repeat(action.cost)}
              {action.maxPerDay ? ` ${usedToday}/${action.maxPerDay}` : ''}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted mt-0.5 line-clamp-2">{action.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {effects.slice(0, 4).map(([k, v]) => (
              <span
                key={k}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${v > 0 ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'}`}
              >
                {fmtEffect(k, v)}
              </span>
            ))}
          </div>
          {disabled && reason && <p className="mt-1 text-[10px] text-warning font-semibold">{reason}</p>}
        </div>
      </div>
    </motion.button>
  )
}
