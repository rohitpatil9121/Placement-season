import { motion } from 'framer-motion'
import type { AllStatKey, Effects, GameEvent, GameState } from '../types/game'
import { RARITY_LABEL } from '../data/events'
import { STAT_META } from '../utils/gameLogic'
import { Modal } from './Modal'

type Props = {
  state: GameState
  onResolve: (choice?: number) => void
}

const RARITY_COLOR: Record<GameEvent['rarity'], string> = {
  common: '#94A3B8',
  uncommon: '#4ADE80',
  rare: '#38BDF8',
  epic: '#7C5CFC',
  legendary: '#FBBF24',
}

function EffectChips({ effects }: { effects: Effects }) {
  const entries = (Object.entries(effects) as [AllStatKey, number][]).filter(([, v]) => v)
  if (!entries.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => {
        const meta = STAT_META[k]
        const val = k === 'cgpa' ? (v / 20).toFixed(2) : String(Math.round(v * 10) / 10)
        return (
          <span
            key={k}
            className={`text-xs font-semibold px-2 py-1 rounded-lg ${v > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}
          >
            {v > 0 ? '+' : ''}
            {val} {meta.emoji} {meta.label}
          </span>
        )
      })}
    </div>
  )
}

export function EventModal({ state, onResolve }: Props) {
  const pending = state.pendingEvent
  const ev = pending?.event
  const color = ev ? RARITY_COLOR[ev.rarity] : '#fff'

  let preview: Effects = {}
  if (ev && !ev.choices) {
    preview = { ...(ev.effects ?? {}) }
    if (ev.conditional) {
      const branch = state.stats[ev.conditional.key] >= ev.conditional.threshold ? ev.conditional.above : ev.conditional.below
      for (const [k, v] of Object.entries(branch) as [AllStatKey, number][]) preview[k] = (preview[k] ?? 0) + v
    }
  }

  return (
    <Modal open={!!ev} dismissable={false} size="md" labelledBy="event-title" className={ev?.rarity === 'legendary' ? 'legendary-glow' : ''}>
      {ev && (
        <div className="text-center">
          <span
            className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border"
            style={{ color, borderColor: `${color}55`, background: `${color}14` }}
          >
            {RARITY_LABEL[ev.rarity]} event
          </span>
          <motion.div
            className="text-6xl mt-4"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.05 }}
            aria-hidden
          >
            {ev.emoji}
          </motion.div>
          <h2 id="event-title" className="font-display text-2xl sm:text-3xl font-bold mt-3 tracking-wide" style={{ color }}>
            {ev.title}
          </h2>
          <p className="text-muted mt-3 text-sm sm:text-base leading-relaxed">"{ev.description}"</p>

          {!ev.choices ? (
            <>
              <div className="mt-5 flex justify-center">
                <EffectChips effects={preview} />
              </div>
              <button
                onClick={() => onResolve()}
                className="focus-ring mt-6 w-full sm:w-auto sm:min-w-48 min-h-12 px-6 rounded-2xl font-display font-bold tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
                autoFocus
              >
                ACCEPT FATE
              </button>
            </>
          ) : (
            <div className="mt-5 space-y-2.5 text-left">
              {ev.choices.map((c, i) => (
                <motion.button
                  key={c.label}
                  onClick={() => onResolve(i)}
                  className="focus-ring w-full glass rounded-2xl p-3.5 hover:border-primary/60 text-left min-h-12"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-semibold text-sm sm:text-base">{c.label}</div>
                  <div className="mt-1.5">
                    <EffectChips effects={c.effects} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
