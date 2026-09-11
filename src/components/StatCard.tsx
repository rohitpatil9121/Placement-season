import { motion } from 'framer-motion'
import type { AllStatKey } from '../types/game'
import { STAT_META } from '../utils/gameLogic'
import { toCgpa } from '../utils/scoring'
import { StatBar } from './StatBar'

type Props = {
  statKey: AllStatKey
  value: number
  delta?: number
}

const COLORS: Partial<Record<AllStatKey, string>> = {
  energy: '#FBBF24',
  dsa: '#7C5CFC',
  sleep: '#38BDF8',
  cgpa: '#4ADE80',
  wellbeing: '#FB7185',
  career: '#F472B6',
}

function statusLine(key: AllStatKey, v: number): string {
  switch (key) {
    case 'energy':
      return v <= 0 ? 'Bro, please sleep.' : v < 25 ? 'Running on fumes.' : v < 60 ? 'Functional. Barely.' : v < 90 ? 'Good to go.' : "You're unstoppable."
    case 'dsa':
      return v < 30 ? 'Two Sum is still hard.' : v < 60 ? 'Mediums are survivable.' : v < 80 ? 'Hards on a good day.' : v < 100 ? 'LeetCode fears you.' : 'You ARE the editorial.'
    case 'sleep':
      return v <= 0 ? 'Legally a ghost.' : v < 30 ? 'Eyes: red. Vibes: off.' : v < 60 ? 'Naps are a strategy.' : 'Well rested. Suspicious.'
    case 'cgpa':
      return v < 30 ? 'Backlog risk.' : v < 60 ? 'Respectable.' : v < 80 ? 'Parents approve.' : 'Topper energy.'
    case 'wellbeing':
      return v <= 0 ? 'Send help.' : v < 30 ? 'One LinkedIn post from crying.' : v < 60 ? 'Coping.' : v < 90 ? 'Genuinely okay.' : 'Touched grass. Twice.'
    case 'career':
      return v < 20 ? 'Resume says "enthusiastic".' : v < 45 ? 'Getting shortlisted-ish.' : v < 70 ? 'Interview ready.' : 'Recruiters are DMing you.'
    default:
      return ''
  }
}

export function StatCard({ statKey, value, delta }: Props) {
  const meta = STAT_META[statKey]
  const color = COLORS[statKey] ?? '#7C5CFC'
  const isCgpa = statKey === 'cgpa'
  const display = isCgpa ? toCgpa(value).toFixed(1) : String(Math.round(value))
  const low = !isCgpa && value < 20
  const deltaDisplay = delta && isCgpa ? delta / 20 : delta

  return (
    <motion.div
      className={`glass rounded-2xl p-3.5 sm:p-4 relative overflow-hidden ${low ? 'ring-1 ring-danger/50' : ''}`}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      aria-label={`${meta.label}: ${display}${isCgpa ? '' : ' out of 100'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl" aria-hidden>
            {meta.emoji}
          </span>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{meta.label}</div>
            <div className="font-display text-xl sm:text-2xl font-bold leading-tight" style={{ color }}>
              {display}
              {!isCgpa && <span className="text-muted text-sm font-sans font-medium"> /100</span>}
            </div>
          </div>
        </div>
        {!!deltaDisplay && (
          <motion.span
            key={String(delta) + statKey}
            className={`text-xs font-bold px-2 py-1 rounded-full ${deltaDisplay > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-live="polite"
          >
            {deltaDisplay > 0 ? '+' : ''}
            {isCgpa ? deltaDisplay.toFixed(2) : Math.round(deltaDisplay * 10) / 10}
          </motion.span>
        )}
      </div>
      <div className="mt-3">
        <StatBar value={value} color={color} label={meta.label} />
      </div>
      <p className="mt-2 text-[11px] sm:text-xs text-muted truncate">{statusLine(statKey, value)}</p>
    </motion.div>
  )
}
