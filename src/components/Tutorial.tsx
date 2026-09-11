import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

const STEPS = [
  { emoji: '🎓', title: 'Welcome to Placement Season.', body: 'You are a final-year student. Your CGPA is 7.8. Your confidence is unearned.' },
  { emoji: '📅', title: 'You have 90 days.', body: 'On Day 90, the placement drive decides your fate. Everything before that is preparation. Or procrastination.' },
  { emoji: '● ● ●', title: 'Each day gives you 3 actions.', body: 'Grind DSA, study, build projects, sleep, chill, network. Coffee is free but has consequences.' },
  { emoji: '⚖️', title: 'Every decision affects your future.', body: 'Six stats. No perfect strategy. Skills get harder to improve as they grow, and neglected ones fade.' },
  { emoji: '🎲', title: 'Random events can ruin your plans.', body: 'Surprise vivas. LinkedIn. Mom calling about Sharma ji ka beta. Some events give you choices.' },
  { emoji: '🍀', title: "Good luck. You'll need it.", body: 'Results may be emotionally accurate. Achievements and a leaderboard track your suffering.' },
]

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-6 sm:p-10 w-full max-w-lg text-center" role="region" aria-label="Tutorial">
        <div className="flex justify-center gap-1.5 mb-6" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
          {STEPS.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <div className="font-display text-4xl sm:text-5xl mb-4" aria-hidden>
              {step.emoji}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">{step.title}</h2>
            <p className="text-muted mt-3 text-sm sm:text-base leading-relaxed">{step.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex gap-3">
          <button onClick={onDone} className="focus-ring min-h-12 flex-1 rounded-2xl glass font-display font-bold tracking-wider">
            SKIP TUTORIAL
          </button>
          <button
            onClick={() => (last ? onDone() : setI(i + 1))}
            className="focus-ring min-h-12 flex-1 rounded-2xl bg-primary text-white font-display font-bold tracking-wider shadow-lg shadow-primary/30"
          >
            {last ? "LET'S GO" : 'NEXT'}
          </button>
        </div>
      </div>
    </main>
  )
}
