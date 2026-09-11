import { AnimatePresence, motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { GameState, StatKey } from '../types/game'
import { toCgpa } from '../game/scoring'
import { closingLine, share, shareText } from '../utils/share'
import { Confetti } from './Confetti'
import { Mascot } from './Mascot'
import { GOLD, STAT_COLOR, alpha, outcomeColor } from './theme'

type Props = {
  state: GameState
  reduced: boolean
  onPlayAgain: () => void
  onHome: () => void
  onNotify: (n: { kind: 'info' | 'error'; title: string; body?: string }) => void
  onBeat?: (i: number) => void
}

type Step = { label: string; value: string; color: string }

const TAGLINES = ['Same college. New mistakes.', 'One more semester. What could go wrong?', 'The sheet is waiting.', 'Different seed. Same Sharma ji.', 'Run it back.']

export function PlacementDay({ state, reduced, onPlayAgain, onHome, onNotify, onBeat }: Props) {
  const r = state.result!
  const s = state.stats
  const m = state.metrics
  const oc = outcomeColor(r.score)
  const steps: Step[] = [
    { label: 'Your score', value: String(r.score), color: oc.bg },
    { label: 'Interview', value: String(Math.round(s.interview)), color: STAT_COLOR.interview },
    { label: 'DSA', value: String(Math.round(s.dsa)), color: STAT_COLOR.dsa },
    { label: 'CGPA', value: toCgpa(s.cgpa).toFixed(1), color: STAT_COLOR.cgpa },
  ]
  const [stage, setStage] = useState(reduced ? steps.length + 2 : 0)
  const [copied, setCopied] = useState(false)
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])

  useEffect(() => {
    if (reduced) return
    if (stage > steps.length + 1) return
    if (stage >= 1 && stage <= steps.length) onBeat?.(stage)
    const wait = stage === 0 ? 1600 : stage === steps.length + 1 ? 2200 : 1100
    const t = window.setTimeout(() => setStage((x) => x + 1), wait)
    return () => window.clearTimeout(t)
  }, [stage, reduced, steps.length, onBeat])

  const doShare = async () => {
    const res = await share(shareText(state))
    if (res === 'copied') {
      setCopied(true)
      onNotify({ kind: 'info', title: 'Copied. Go humblebrag.' })
      window.setTimeout(() => setCopied(false), 2500)
    } else if (res === 'failed') onNotify({ kind: 'error', title: 'Could not copy.', body: 'A screenshot works just as well.' })
  }

  const skip = () => setStage(steps.length + 2)
  const verdict = stage === steps.length + 1

  if (stage <= steps.length + 1) {
    const bg = verdict ? oc.bg : 'transparent'
    const fg = verdict ? oc.fg : 'var(--color-ink)'
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 transition-colors duration-700" style={{ background: bg, color: fg }} onClick={skip}>
        {verdict && r.placed && <Confetti trigger={1} amount={r.score >= 86 ? 1 : 0.5} colors={[GOLD, '#fff', oc.bg, '#FFD97A']} />}
        <div className="w-full max-w-md text-center">
          <AnimatePresence mode="wait">
            {stage === 0 && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <p className="eyebrow">Placement day</p>
                <p className="serif text-[88px] sm:text-[120px] leading-none mt-3 tnum" style={{ color: GOLD }}>90<span className="text-faint">/90</span></p>
                <p className="mt-6 text-muted">Your journey is complete.</p>
              </motion.div>
            )}
            {stage >= 1 && stage <= steps.length && (
              <motion.div key={`s${stage}`} initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                <p className="eyebrow">{steps[stage - 1].label}</p>
                <div className="relative inline-block mt-2">
                  <motion.span className="absolute inset-0 rounded-full" style={{ background: alpha(steps[stage - 1].color, 0.25) }} initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} aria-hidden />
                  <p className="serif text-[120px] sm:text-[160px] leading-none tnum relative" style={{ color: steps[stage - 1].color }}>{steps[stage - 1].value}</p>
                </div>
              </motion.div>
            )}
            {verdict && (
              <motion.div key="verdict" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex justify-center"><Mascot mood={r.placed ? 'celebrate' : 'worried'} size={140} shirt={oc.fg === '#FFFFFF' ? '#fff' : '#171717'} /></div>
                <p className="serif text-[72px] sm:text-[104px] leading-none mt-2">{r.placed ? 'Placed.' : 'Not placed.'}</p>
                {r.placed && (
                  <>
                    <p className="mt-6 text-[12px] tracking-[0.14em] uppercase opacity-80">{r.role}</p>
                    <p className="serif text-[44px] sm:text-[56px] leading-none mt-2 tnum">₹{r.salaryLpa} LPA</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-14 text-[11px] opacity-60">Click to skip</p>
        </div>
      </main>
    )
  }

  const bars: [string, StatKey, number][] = [
    ['DSA', 'dsa', s.dsa], ['CGPA', 'cgpa', s.cgpa], ['Projects', 'projects', s.projects], ['Interview', 'interview', s.interview],
  ]
  const extras: [string, string | number][] = [
    ['Coffee consumed', m.coffees], ['Applications', m.applicationsSent], ['Sleep sacrificed', `${m.sleepSacrificed} nights`], ['Interviews', m.interviewsAttended],
    ['Rejections', m.rejections], ['Offers', m.offers], ['Problems solved', m.problemsSolved], ['Breakdowns', m.breakdowns],
  ]

  return (
    <main className="min-h-dvh px-5 sm:px-10 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[minmax(0,420px)_1fr] gap-10 lg:gap-16 items-start">
        <motion.article
          aria-label="Result card"
          className="rounded-[22px] p-8 sm:p-10 relative overflow-hidden"
          style={{ background: oc.bg, color: oc.fg, aspectRatio: '9 / 16', display: 'flex', flexDirection: 'column' }}
          initial={{ opacity: 0, y: 16, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full" style={{ background: alpha('#FFFFFF', 0.18) }} aria-hidden />
          <div className="absolute -left-10 bottom-24 w-32 h-32 rounded-full" style={{ background: alpha('#000000', 0.08) }} aria-hidden />
          <p className="relative text-[11px] tracking-[0.18em] uppercase opacity-70">Placement Season · 90 days</p>
          <p className="relative serif text-[13px] tracking-[0.18em] uppercase mt-8 opacity-70">Final result</p>
          <p className="relative serif text-[64px] sm:text-[76px] leading-none mt-2 tnum">{r.placed ? `₹${r.salaryLpa} LPA` : '₹0 LPA'}</p>
          <p className="relative mt-3 text-[15px] opacity-90">{r.placed ? `${r.role}${r.company ? ` · ${r.company}` : ''}` : r.outcome.line}</p>
          <div className="relative mt-8 space-y-3">
            {bars.map(([label, k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-[12px] font-semibold tracking-[0.06em] uppercase"><span className="opacity-80">{label}</span><span className="tnum">{k === 'cgpa' ? toCgpa(v).toFixed(1) : Math.round(v)}</span></div>
                <div className="h-2 rounded-full mt-1 overflow-hidden" style={{ background: alpha('#000000', 0.15) }}>
                  <motion.div className="h-full rounded-full" style={{ background: STAT_COLOR[k], boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.2)' }} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} />
                </div>
              </div>
            ))}
          </div>
          <div className="relative mt-6 text-[12px] opacity-75 space-y-1 tnum">
            <p>Coffee consumed {m.coffees} · Applications {m.applicationsSent}</p>
            <p>Sleep sacrificed {m.sleepSacrificed} nights · Rejections {m.rejections}</p>
          </div>
          <div className="relative mt-auto pt-6 flex items-end justify-between gap-3">
            <p className="serif text-[22px] leading-tight">“{closingLine(r.score)}”</p>
            <Mascot mood={r.placed ? 'celebrate' : 'worried'} size={72} shirt={oc.fg === '#FFFFFF' ? '#fff' : '#171717'} className="shrink-0 -mb-2" />
          </div>
        </motion.article>

        <div>
          <p className="eyebrow">Run complete</p>
          <h1 className="serif text-[44px] sm:text-[60px] leading-none mt-2">{r.outcome.title}<span className="px-1" style={{ background: alpha(oc.bg, 0.5) }}>.</span></h1>
          <p className="mt-4 text-[16px] text-muted max-w-prose">{r.outcome.line}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={doShare} className="btn btn-primary press">{copied ? 'Copied' : 'Share result'}</button>
            <motion.button onClick={onPlayAgain} className="btn btn-ghost press group" whileHover="spin">
              <motion.span variants={{ spin: { rotate: 360 } }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="inline-flex"><RotateCw size={16} strokeWidth={2} /></motion.span> Play again
            </motion.button>
            <button onClick={onHome} className="btn press text-muted hover:text-ink">Start screen</button>
          </div>
          <p className="mt-3 text-[13px] text-muted italic">{tagline}</p>

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
              <p className="mt-2 text-[14px] text-muted">{state.achievements.length} achievement{state.achievements.length === 1 ? '' : 's'}. Tap the trophy to see them.</p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
