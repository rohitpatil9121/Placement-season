import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { GameState } from '../types/game'
import { toCgpa } from '../game/scoring'
import { closingLine, share, shareText } from '../utils/share'

type Props = { state: GameState; reduced: boolean; onPlayAgain: () => void; onHome: () => void; onNotify: (n: { kind: 'info' | 'error'; title: string; body?: string }) => void }

type Step = { label: string; value: string }

export function PlacementDay({ state, reduced, onPlayAgain, onHome, onNotify }: Props) {
  const r = state.result!
  const s = state.stats
  const m = state.metrics
  const steps: Step[] = [
    { label: 'Your score', value: String(r.score) },
    { label: 'Interview', value: String(Math.round(s.interview)) },
    { label: 'DSA', value: String(Math.round(s.dsa)) },
    { label: 'CGPA', value: toCgpa(s.cgpa).toFixed(1) },
  ]
  // stage: 0 intro, 1..steps reveal, steps+1 verdict, steps+2 card
  const [stage, setStage] = useState(reduced ? steps.length + 2 : 0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (reduced) return
    if (stage > steps.length + 1) return
    const wait = stage === 0 ? 1600 : stage === steps.length + 1 ? 1800 : 1100
    const t = window.setTimeout(() => setStage((x) => x + 1), wait)
    return () => window.clearTimeout(t)
  }, [stage, reduced, steps.length])

  const doShare = async () => {
    const res = await share(shareText(state))
    if (res === 'copied') {
      setCopied(true)
      onNotify({ kind: 'info', title: 'Copied. Go humblebrag.' })
      window.setTimeout(() => setCopied(false), 2500)
    } else if (res === 'failed') onNotify({ kind: 'error', title: 'Could not copy.', body: 'A screenshot works just as well.' })
  }

  const skip = () => setStage(steps.length + 2)

  if (stage <= steps.length + 1) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6" onClick={skip}>
        <div className="w-full max-w-md text-center">
          <AnimatePresence mode="wait">
            {stage === 0 && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <p className="eyebrow">Placement day</p>
                <p className="serif text-[88px] sm:text-[120px] leading-none mt-3 tnum">90<span className="text-faint">/90</span></p>
                <p className="mt-6 text-muted">Your journey is complete.</p>
              </motion.div>
            )}
            {stage >= 1 && stage <= steps.length && (
              <motion.div key={`s${stage}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
                <p className="eyebrow">{steps[stage - 1].label}</p>
                <p className="serif text-[120px] sm:text-[160px] leading-none mt-2 tnum">{steps[stage - 1].value}</p>
              </motion.div>
            )}
            {stage === steps.length + 1 && (
              <motion.div key="verdict" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <p className="serif text-[72px] sm:text-[104px] leading-none">
                  {r.placed ? <>Placed<span className="mark px-1">.</span></> : 'Not placed.'}
                </p>
                {r.placed && (
                  <>
                    <p className="mt-6 text-[12px] tracking-[0.14em] uppercase text-muted">{r.role}</p>
                    <p className="serif text-[44px] sm:text-[56px] leading-none mt-2 tnum">₹{r.salaryLpa} LPA</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-14 text-[11px] text-faint">Click to skip</p>
        </div>
      </main>
    )
  }

  const stats: [string, string | number][] = [
    ['DSA', Math.round(s.dsa)],
    ['CGPA', toCgpa(s.cgpa).toFixed(1)],
    ['Projects', Math.round(s.projects)],
    ['Interview', Math.round(s.interview)],
  ]
  const extras: [string, string | number][] = [
    ['Coffee consumed', m.coffees],
    ['Applications', m.applicationsSent],
    ['Sleep sacrificed', `${m.sleepSacrificed} nights`],
    ['Interviews', m.interviewsAttended],
    ['Rejections', m.rejections],
    ['Offers', m.offers],
    ['Problems solved', m.problemsSolved],
    ['Breakdowns', m.breakdowns],
  ]

  return (
    <main className="min-h-dvh px-5 sm:px-10 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[minmax(0,420px)_1fr] gap-10 lg:gap-16 items-start">
        {/* poster card */}
        <motion.article
          aria-label="Result card"
          className="bg-deep text-paper rounded-[18px] p-8 sm:p-10 relative overflow-hidden"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-lime/90" aria-hidden />
          <p className="relative text-[11px] tracking-[0.18em] uppercase text-paper/60">Placement Season · 90 days</p>
          <p className="relative serif text-[13px] tracking-[0.18em] uppercase mt-10 text-paper/60">Final result</p>
          <p className="relative serif text-[60px] sm:text-[72px] leading-none mt-2 tnum">{r.placed ? `₹${r.salaryLpa} LPA` : '₹0 LPA'}</p>
          <p className="relative mt-3 text-[15px] text-paper/85">{r.placed ? `${r.role}${r.company ? ` · ${r.company}` : ''}` : r.outcome.line}</p>
          <div className="relative mt-10 grid grid-cols-2 gap-x-6 gap-y-3">
            {stats.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-paper/15 pb-2 text-[14px]">
                <span className="text-paper/60 uppercase tracking-[0.1em] text-[11px] self-end">{k}</span>
                <span className="font-semibold tnum">{v}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-6 text-[12px] text-paper/60 space-y-1 tnum">
            <p>Coffee consumed {m.coffees} · Applications {m.applicationsSent}</p>
            <p>Sleep sacrificed {m.sleepSacrificed} nights · Rejections {m.rejections}</p>
          </div>
          <p className="relative serif text-[22px] mt-10 text-lime">“{closingLine(r.score)}”</p>
        </motion.article>

        <div>
          <p className="eyebrow">Run complete</p>
          <h1 className="serif text-[44px] sm:text-[60px] leading-none mt-2">{r.outcome.title}<span className="mark px-1">.</span></h1>
          <p className="mt-4 text-[16px] text-muted max-w-prose">{r.outcome.line}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={doShare} className="btn btn-primary press">{copied ? 'Copied' : 'Share result'}</button>
            <button onClick={onPlayAgain} className="btn btn-ghost press">Play again</button>
            <button onClick={onHome} className="btn press text-muted hover:text-ink">Start screen</button>
          </div>

          <p className="eyebrow mt-12">The season, in numbers</p>
          <ul className="mt-2 grid sm:grid-cols-2 gap-x-10">
            {extras.map(([k, v], i) => (
              <motion.li key={k} className="flex justify-between py-2.5 border-b hairline text-[14px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <span className="text-muted">{k}</span>
                <span className="font-semibold tnum">{v}</span>
              </motion.li>
            ))}
          </ul>

          {state.achievements.length > 0 && (
            <>
              <p className="eyebrow mt-10">Unlocked this run</p>
              <p className="mt-2 text-[14px] text-muted">{state.achievements.length} achievement{state.achievements.length === 1 ? '' : 's'}. See them in Settings.</p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
