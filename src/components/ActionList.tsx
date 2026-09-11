import { motion } from 'framer-motion'
import { ArrowRight, Flame } from 'lucide-react'
import type { ActionId, GameState } from '../types/game'
import { ACTIONS } from '../game/actions'
import { ACTIONS_PER_DAY } from '../game/balance'
import { canAct, previewAction } from '../game/engine'
import { EffectList, Icon } from './ui'
import { ACTION_COLOR, GOLD } from './theme'
import { FloatingDeltas } from './FloatingDeltas'
import type { Effects, StreakKey } from '../types/game'
import { STREAK_BONUS_AT } from '../game/balance'

type Props = { state: GameState; onAct: (id: ActionId) => void; hint: boolean; deltas: Effects; nonce: number; onPeek?: (e: Effects | null) => void }

const STREAK_OF: Partial<Record<ActionId, StreakKey>> = { dsa: 'dsa', study: 'study', college: 'study', sleep: 'sleep' }

export function ActionDots({ remaining }: { remaining: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${remaining} of ${ACTIONS_PER_DAY} actions remaining`}>
      {Array.from({ length: ACTIONS_PER_DAY }, (_, i) => {
        const on = i < remaining
        return (
          <motion.span
            key={i}
            className="block w-3.5 h-3.5 rounded-full border-2"
            style={{ background: on ? GOLD : 'transparent', borderColor: on ? '#C99A12' : 'var(--color-line)', boxShadow: on ? 'inset 0 -2px 0 rgba(0,0,0,0.18)' : 'none' }}
            initial={false}
            animate={{ rotateY: on ? 0 : 180, scale: on ? 1 : 0.85 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          />
        )
      })}
    </span>
  )
}

export function ActionList({ state, onAct, hint, deltas, nonce, onPeek }: Props) {
  const remaining = state.actionsRemaining
  return (
    <section aria-label="Today's actions" className="relative">
      <FloatingDeltas deltas={deltas} nonce={nonce} />
      <div className="flex items-baseline justify-between">
        <div>
          <p className="eyebrow eyebrow-dot">Today</p>
          <p className="serif text-3xl sm:text-4xl mt-1">{remaining === 0 ? 'Nothing left to do.' : remaining === ACTIONS_PER_DAY ? 'Pick your battles.' : 'Keep going.'}</p>
        </div>
        <div className="text-right">
          <ActionDots remaining={remaining} />
          <p className="text-[13px] text-muted mt-1.5 tnum font-medium">{remaining} action{remaining === 1 ? '' : 's'} remaining</p>
        </div>
      </div>
      {hint && (
        <p className="mt-3 text-[13px] text-muted">
          <span className="mark px-1 text-ink font-medium">You have three actions.</span> Each one changes your state. Then the day ends.
        </p>
      )}

      <ul className="mt-5 grid sm:grid-cols-2 gap-3">
        {ACTIONS.map((a, i) => {
          const check = canAct(state, a.id)
          const preview = previewAction(state, a.id)
          const used = state.usedToday[a.id] ?? 0
          return (
            <li key={a.id} style={{ ['--tile' as string]: ACTION_COLOR[a.id] }}>
              <motion.button
                onClick={() => onAct(a.id)}
                onMouseEnter={() => check.ok && onPeek?.(preview)}
                onMouseLeave={() => onPeek?.(null)}
                onFocus={() => check.ok && onPeek?.(preview)}
                onBlur={() => onPeek?.(null)}
                disabled={!check.ok}
                aria-disabled={!check.ok}
                className="tile group w-full h-full text-left p-4 flex items-start gap-4 disabled:opacity-45"
              >
                <span className="badge" style={{ background: ACTION_COLOR[a.id], width: 48, height: 48, borderRadius: 14 }} aria-hidden>
                  <Icon name={a.icon} size={22} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-[17px] sm:text-[18px]">{a.name}</span>
                    {i < 9 && <kbd className="hidden lg:inline text-[10px] text-faint border hairline rounded px-1 leading-4">{i + 1}</kbd>}
                    {a.maxPerDay && <span className="text-[11px] text-faint tnum">{used}/{a.maxPerDay}</span>}
                    {a.cost !== 1 && <span className="text-[11px] text-faint">{a.cost === 0 ? 'free' : `${a.cost} actions`}</span>}
                    {STREAK_OF[a.id] && state.streaks[STREAK_OF[a.id]!] >= 2 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-1.5 py-0.5 tnum" style={{ background: 'rgba(255,176,32,0.18)', color: '#9A5B00' }}>
                        <Flame size={11} strokeWidth={2.2} fill={state.streaks[STREAK_OF[a.id]!] >= STREAK_BONUS_AT ? '#FFB020' : 'none'} /> {state.streaks[STREAK_OF[a.id]!]}-day streak
                      </span>
                    )}
                  </span>
                  <span className="block text-[14px] text-muted mt-1 leading-snug">{a.description}</span>
                  <span className="block mt-1.5">
                    {check.ok || !check.reason ? <EffectList effects={preview} /> : <span className="text-[12px] text-warn font-medium">{check.reason}</span>}
                  </span>
                </span>
                <span className="mt-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" style={{ color: ACTION_COLOR[a.id] }} aria-hidden>
                  <ArrowRight size={16} strokeWidth={2} />
                </span>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
