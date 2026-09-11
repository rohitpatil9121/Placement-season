import { motion } from 'framer-motion'
import type { Effects, GameState, StatKey } from '../types/game'
import { EffectList, Sheet } from './ui'
import { Flash, Sparkles } from './Confetti'
import { GOLD, STAT_COLOR, alpha } from './theme'
import { useEffect, useState } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIMES = ['9:40 AM', '11:42 AM', '1:15 PM', '4:20 PM', '7:05 PM', '11:58 PM']

export function EventSheet({ state, onResolve }: { state: GameState; onResolve: (i?: number) => void }) {
  const ev = state.activeEvent
  const big = ev?.rarity === 'epic' || ev?.rarity === 'legendary'
  let preview: Effects = {}
  if (ev && !ev.choices) {
    preview = { ...(ev.effects ?? {}) }
    if (ev.conditional) {
      const b = state.stats[ev.conditional.key] >= ev.conditional.threshold ? ev.conditional.above : ev.conditional.below
      for (const [k, v] of Object.entries(b) as [StatKey, number][]) preview[k] = (preview[k] ?? 0) + v
    }
  }
  const stamp = ev ? `${DAYS[(state.day + ev.id.length) % 7]} · ${TIMES[(state.day * 3 + state.actionsRemaining) % TIMES.length]}` : ''
  const negative = ev?.tags?.includes('negative') || ev?.tags?.includes('rejection') || ev?.tags?.includes('breakdown')
  const tone = ev?.rarity === 'legendary' ? GOLD : ev?.rarity === 'epic' ? STAT_COLOR.dsa : ev?.rarity === 'rare' ? (negative ? STAT_COLOR.wellbeing : STAT_COLOR.projects) : negative ? STAT_COLOR.wellbeing : STAT_COLOR.cgpa
  const [legendaryTick, setLegendaryTick] = useState(0)
  useEffect(() => {
    if (ev?.rarity === 'legendary') setLegendaryTick((n) => n + 1)
  }, [ev])

  return (
    <>
    <Flash trigger={ev?.rarity === 'legendary' ? legendaryTick : 0} color={alpha(GOLD, 0.55)} />
    <Sparkles trigger={ev?.rarity === 'legendary' ? legendaryTick : 0} color={GOLD} />
    <Sheet open={!!ev} dim={true} label={ev?.title ?? 'Event'} width={big ? 'max-w-xl' : 'max-w-lg'} wash={big ? alpha(tone, 0.35) : undefined} accent={tone}>
      {ev && (
        <div className="p-7 sm:p-10">
          <p className="eyebrow inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: tone }} aria-hidden />{stamp}</p>
          <motion.h2
            className={`serif mt-4 leading-[1.02] ${big ? 'text-[40px] sm:text-[52px]' : 'text-[32px] sm:text-[40px]'}`}
            initial={{ opacity: 0, y: big ? 12 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: big ? 0.5 : 0.3, delay: 0.05 }}
          >
            {ev.title}
            {ev.rarity === 'legendary' && <span className="ml-1 px-1" style={{ background: alpha(GOLD, 0.6) }}>.</span>}
          </motion.h2>
          {ev.body && <p className="mt-5 text-[16px] leading-relaxed text-ink/85 max-w-prose">{ev.body}</p>}
          {ev.quote && <p className="serif mt-4 text-[22px] leading-snug text-ink">“{ev.quote}”</p>}

          {!ev.choices ? (
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <EffectList effects={preview} size="md" />
              <button onClick={() => onResolve()} className="btn btn-primary press self-start sm:self-auto">
                Continue <span aria-hidden>→</span>
              </button>
            </div>
          ) : (
            <div className="mt-8">
              <p className="eyebrow mb-3">What do you do?</p>
              <ul className="border-t hairline">
                {ev.choices.map((c, i) => (
                  <li key={c.label} className="border-b hairline">
                    <motion.button
                      onClick={() => onResolve(i)}
                      className="w-full text-left py-3.5 flex items-start justify-between gap-4 press group"
                      whileHover={{ x: 3 }} transition={{ duration: 0.16 }}
                    >
                      <span>
                        <span className="font-semibold text-[15px] block">{c.label}</span>
                        <EffectList effects={c.effects} className="mt-1" />
                      </span>
                      <span className="text-faint opacity-0 group-hover:opacity-100 mt-1" aria-hidden>→</span>
                    </motion.button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Sheet>
    </>
  )
}
