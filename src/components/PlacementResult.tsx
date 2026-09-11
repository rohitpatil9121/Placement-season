import { motion } from 'framer-motion'
import { RotateCcw, Share2, Trophy, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { GameState } from '../types/game'
import { toCgpa } from '../utils/scoring'
import { buildShareText, shareResult } from '../utils/share'
import { RadarChart } from './RadarChart'

type Props = {
  state: GameState
  onPlayAgain: () => void
  onAchievements: () => void
  onHome: () => void
  onToast: (t: { kind: 'info' | 'error'; title: string; emoji?: string; body?: string }) => void
}

export function PlacementResult({ state, onPlayAgain, onAchievements, onHome, onToast }: Props) {
  const r = state.finalResult!
  const s = state.stats
  const c = state.counters
  const [shared, setShared] = useState<'idle' | 'copied' | 'shared'>('idle')
  const placed = r.salaryLpa > 0
  const sleepAvg = Math.round(c.sleepTotal / Math.max(1, state.day - 1))

  const share = async () => {
    const res = await shareResult(buildShareText(state))
    if (res === 'copied') {
      setShared('copied')
      onToast({ kind: 'info', emoji: '📋', title: 'Result copied to clipboard', body: 'Paste it in the placement group. Cause chaos.' })
    } else if (res === 'shared') setShared('shared')
    else onToast({ kind: 'error', emoji: '😵', title: 'Could not share', body: 'Your browser blocked it. Screenshot works too.' })
    window.setTimeout(() => setShared('idle'), 2500)
  }

  const funStats: Array<[string, string | number, string]> = [
    ['Days survived', state.day, '📅'],
    ['Sleep average', sleepAvg, '😴'],
    ['Coffee consumed', c.coffees, '☕'],
    ['DSA problems solved', c.dsaProblems, '🧩'],
    ['Applications sent', c.applicationsSent, '📨'],
    ['Mental breakdowns', c.breakdowns, '😭'],
    ['Referrals', c.referrals, '🤝'],
    ['Rejections', c.rejections, '💀'],
    ['Surprise vivas', c.vivas, '🚨'],
    ['Mock interviews', c.mocksDone, '🎤'],
  ]

  const btn = 'focus-ring min-h-12 rounded-2xl px-5 font-display font-bold tracking-wider flex items-center justify-center gap-2'

  return (
    <main className="min-h-dvh p-4 sm:p-8 flex items-center justify-center">
      <motion.div className="w-full max-w-4xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted font-bold">Placement Result</p>
          <motion.div className="text-7xl mt-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.2 }} aria-hidden>
            {r.outcome.emoji}
          </motion.div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mt-3 tracking-tight" style={{ color: r.outcome.color, textShadow: `0 0 30px ${r.outcome.color}66` }}>
            {placed ? 'YOU GOT PLACED!' : 'NO OFFER. YET.'}
          </h1>
          <p className="text-muted mt-2 text-sm sm:text-base">{r.outcome.subtitle}</p>
        </div>

        <motion.div
          className="glass rounded-3xl p-6 sm:p-8 mt-6 text-center"
          style={{ boxShadow: `0 0 0 1px ${r.outcome.color}55, 0 20px 60px -20px ${r.outcome.color}66` }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="font-display text-5xl sm:text-6xl font-bold" style={{ color: r.outcome.color }}>
            {placed ? `₹${r.salaryLpa} LPA` : '₹0 LPA'}
          </div>
          <div className="mt-2 text-lg font-semibold">{r.role}</div>
          <div className="text-muted text-sm">{r.company}</div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full border" style={{ color: r.outcome.color, borderColor: `${r.outcome.color}55`, background: `${r.outcome.color}14` }}>
            {r.outcome.emoji} {r.outcome.title} · Score {r.score}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="glass rounded-3xl p-5 flex flex-col items-center">
            <h2 className="font-display font-bold self-start">Final Stats</h2>
            <RadarChart
              color={r.outcome.color}
              axes={[
                { label: 'DSA', value: s.dsa, emoji: '🧠' },
                { label: 'CGPA', value: s.cgpa, emoji: '📚' },
                { label: 'Projects', value: s.projects, emoji: '💻' },
                { label: 'Interview', value: s.interview, emoji: '🎤' },
                { label: 'Network', value: s.networking, emoji: '🤝' },
                { label: 'Resume', value: s.resume, emoji: '📄' },
              ]}
            />
            <div className="grid grid-cols-3 gap-2 w-full text-center text-sm">
              {[
                ['DSA', Math.round(s.dsa)],
                ['CGPA', toCgpa(s.cgpa).toFixed(1)],
                ['Projects', Math.round(s.projects)],
                ['Interview', Math.round(s.interview)],
                ['Networking', Math.round(s.networking)],
                ['Wellbeing', Math.round(s.wellbeing)],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl bg-white/4 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
                  <div className="font-display font-bold">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <h2 className="font-display font-bold">Season Summary</h2>
            <ul className="mt-3 space-y-2">
              {funStats.map(([k, v, e], i) => (
                <motion.li
                  key={k}
                  className="flex items-center justify-between text-sm border-b border-white/5 pb-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <span className="text-muted">
                    <span aria-hidden>{e}</span> {k}
                  </span>
                  <span className="font-display font-bold">{v}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button onClick={onPlayAgain} className={`${btn} bg-primary text-white shadow-lg shadow-primary/30`}>
            <RotateCcw size={18} /> PLAY AGAIN
          </button>
          <button onClick={share} className={`${btn} glass`}>
            {shared === 'copied' ? <Check size={18} className="text-success" /> : shared === 'shared' ? <Check size={18} /> : <Share2 size={18} />}
            {shared === 'copied' ? 'COPIED!' : 'SHARE RESULT'}
          </button>
          <button onClick={onAchievements} className={`${btn} glass`}>
            <Trophy size={18} /> ACHIEVEMENTS
          </button>
        </div>
        <div className="mt-3 text-center">
          <button onClick={onHome} className="focus-ring text-sm text-muted hover:text-text underline-offset-4 hover:underline min-h-11 px-3">
            Back to start
          </button>
        </div>
        <details className="mt-4 text-xs text-muted">
          <summary className="cursor-pointer focus-ring rounded px-1 inline-flex items-center gap-1">
            <Copy size={12} /> Preview share text
          </summary>
          <pre className="glass rounded-2xl p-3 mt-2 whitespace-pre-wrap font-mono text-[11px] overflow-x-auto">{buildShareText(state)}</pre>
        </details>
      </motion.div>
    </main>
  )
}
