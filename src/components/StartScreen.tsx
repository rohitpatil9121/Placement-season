import { motion } from 'framer-motion'
import { BookOpen, Play, RotateCcw, Trophy, Medal } from 'lucide-react'
import { useState } from 'react'
import type { GameState } from '../types/game'

type Props = {
  hasSave: boolean
  saved: GameState | null
  onStart: () => void
  onContinue: () => void
  onHowToPlay: () => void
  onAchievements: () => void
  onLeaderboard: () => void
}

const ICONS = ['💻', '📚', '☕', '😴', '💀', '💼']

export function StartScreen({ hasSave, saved, onStart, onContinue, onHowToPlay, onAchievements, onLeaderboard }: Props) {
  const [confirmNew, setConfirmNew] = useState(false)
  const primary = 'focus-ring min-h-12 rounded-2xl px-6 font-display font-bold tracking-wider flex items-center justify-center gap-2'

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-8">
      <motion.div
        className="w-full max-w-2xl text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center gap-3 sm:gap-5 text-3xl sm:text-4xl mb-6" aria-hidden>
          {ICONS.map((ic, i) => (
            <motion.span
              key={ic}
              animate={{ y: [0, -10, 0], rotate: [0, i % 2 ? 8 : -8, 0] }}
              transition={{ duration: 2.4 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            >
              {ic}
            </motion.span>
          ))}
        </div>

        <motion.h1
          className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-glow"
          style={{ background: 'linear-gradient(120deg, #F8FAFC, #C4B5FD 50%, #7C5CFC)', WebkitBackgroundClip: 'text', color: 'transparent' }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          PLACEMENT SEASON
        </motion.h1>
        <p className="mt-3 text-muted text-base sm:text-lg font-medium">90 days. 3 actions a day. One placement.</p>
        <p className="mt-5 font-display text-2xl sm:text-3xl font-bold">Can you survive final year?</p>

        {hasSave && saved && (
          <div className="glass rounded-2xl p-3 mt-6 text-sm text-muted inline-flex items-center gap-2">
            <span aria-hidden>💾</span>
            {saved.status === 'finished'
              ? `Last run finished: ${saved.finalResult?.outcome.emoji ?? ''} ${saved.finalResult?.outcome.title ?? ''}`
              : `Saved game found — Day ${saved.day} / 90`}
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
          {hasSave && saved && saved.status === 'playing' ? (
            <>
              <button onClick={onContinue} className={`${primary} bg-primary text-white shadow-lg shadow-primary/30 sm:col-span-2`}>
                <Play size={18} /> CONTINUE GAME
              </button>
              {!confirmNew ? (
                <button onClick={() => setConfirmNew(true)} className={`${primary} glass hover:border-danger/50 sm:col-span-2`}>
                  <RotateCcw size={18} /> NEW GAME
                </button>
              ) : (
                <div className="glass rounded-2xl p-3 sm:col-span-2 text-sm">
                  <p className="text-muted mb-2">This will delete your Day {saved.day} save. Your placement group will never know.</p>
                  <div className="flex gap-2">
                    <button onClick={onStart} className={`${primary} flex-1 bg-danger/90 text-white`}>
                      YES, RESTART
                    </button>
                    <button onClick={() => setConfirmNew(false)} className={`${primary} flex-1 glass`}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <button onClick={onStart} className={`${primary} bg-primary text-white shadow-lg shadow-primary/30 sm:col-span-2`}>
                <Play size={18} /> START GAME
              </button>
              {hasSave && saved?.status === 'finished' && (
                <button onClick={onContinue} className={`${primary} glass sm:col-span-2`}>
                  <Medal size={18} /> VIEW LAST RESULT
                </button>
              )}
            </>
          )}
          <button onClick={onHowToPlay} className={`${primary} glass`}>
            <BookOpen size={18} /> HOW TO PLAY
          </button>
          <button onClick={onAchievements} className={`${primary} glass`}>
            <Trophy size={18} /> ACHIEVEMENTS
          </button>
          <button onClick={onLeaderboard} className={`${primary} glass sm:col-span-2`}>
            <Medal size={18} /> LEADERBOARD
          </button>
        </div>

        <p className="mt-8 text-xs text-muted">Results may be emotionally accurate.</p>
      </motion.div>
    </main>
  )
}
