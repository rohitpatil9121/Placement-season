import { AnimatePresence, motion } from 'framer-motion'
import { Home, Settings, Trophy, Volume2, VolumeX, Check } from 'lucide-react'
import { TOTAL_DAYS, getPhase } from '../data/phases'

type Props = {
  day: number
  sound: boolean
  onToggleSound: () => void
  onSettings: () => void
  onHome: () => void
  onAchievements: () => void
  savedTick: number
}

export function GameHeader({ day, sound, onToggleSound, onSettings, onHome, onAchievements, savedTick }: Props) {
  const phase = getPhase(day)
  const btn = 'focus-ring min-w-11 min-h-11 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-white/6 transition'
  return (
    <header className="glass rounded-2xl px-3 sm:px-5 py-2.5 flex items-center gap-2 sm:gap-4">
      <button onClick={onHome} className="focus-ring flex items-center gap-2 rounded-xl px-1 py-1 min-h-11" aria-label="Back to start screen">
        <span className="text-xl" aria-hidden>🎓</span>
        <span className="font-display font-bold tracking-wide text-sm sm:text-base hidden xs:inline sm:inline">PLACEMENT SEASON</span>
      </button>

      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 min-w-0">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={day}
            className="font-display font-bold text-base sm:text-lg whitespace-nowrap"
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 14, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            Day {day} <span className="text-muted font-sans font-medium">/ {TOTAL_DAYS}</span>
          </motion.div>
        </AnimatePresence>
        <span
          className="hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10"
          style={{ color: `rgb(${phase.glow})`, background: `rgba(${phase.glow}, 0.12)` }}
        >
          {phase.emoji} {phase.name}
        </span>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <AnimatePresence>
          {savedTick > 0 && (
            <motion.span
              key={savedTick}
              className="hidden sm:flex items-center gap-1 text-[11px] text-success mr-1"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              aria-live="polite"
            >
              <Check size={12} /> Saved
            </motion.span>
          )}
        </AnimatePresence>
        <button onClick={onAchievements} className={btn} aria-label="Achievements">
          <Trophy size={19} />
        </button>
        <button onClick={onToggleSound} className={btn} aria-label={sound ? 'Mute sound' : 'Unmute sound'} aria-pressed={sound}>
          {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
        <button onClick={onSettings} className={btn} aria-label="Settings">
          <Settings size={19} />
        </button>
        <button onClick={onHome} className={`${btn} hidden sm:flex`} aria-label="Home">
          <Home size={19} />
        </button>
      </div>
    </header>
  )
}
