import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { GameState } from '../types/game'
import { PlacementResult } from './PlacementResult'

type Props = React.ComponentProps<typeof PlacementResult> & { state: GameState; reduced: boolean }

const LINES = ['Resume uploaded.', 'Aptitude round... survived.', 'Technical round... "tell me about yourself".', 'HR round... "where do you see yourself in 5 years?"', 'Results are in.']

/** Dramatic "Placement Day" intro, then the full result screen. */
export function GameOverScreen(props: Props) {
  const [phase, setPhase] = useState<'intro' | 'result'>(props.reduced ? 'result' : 'intro')
  const [line, setLine] = useState(0)

  useEffect(() => {
    if (phase !== 'intro') return
    if (line >= LINES.length) {
      const t = window.setTimeout(() => setPhase('result'), 500)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setLine((l) => l + 1), 850)
    return () => window.clearTimeout(t)
  }, [line, phase])

  if (phase === 'result') return <PlacementResult {...props} />

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <motion.div className="text-6xl" animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} aria-hidden>
          🎓
        </motion.div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">PLACEMENT DAY</h1>
        <p className="text-muted mt-2">After 90 days of chaos...</p>
        <div className="mt-8 h-24 relative" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.p
              key={line}
              className="font-display text-lg sm:text-xl font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {LINES[Math.min(line, LINES.length - 1)]}
            </motion.p>
          </AnimatePresence>
        </div>
        <button onClick={() => setPhase('result')} className="focus-ring text-sm text-muted hover:text-text min-h-11 px-3">
          Skip →
        </button>
      </div>
    </main>
  )
}
