import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ActionId, GameState } from '../types/game'
import { ACTIONS } from '../game/actions'
import { ACTIONS_PER_DAY } from '../game/balance'
import { canAct, previewAction } from '../game/engine'
import { EffectList, Icon } from './ui'

type Props = { state: GameState; onAct: (id: ActionId) => void; hint: boolean }

export function ActionDots({ remaining }: { remaining: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${remaining} of ${ACTIONS_PER_DAY} actions remaining`}>
      {Array.from({ length: ACTIONS_PER_DAY }, (_, i) => (
        <motion.span
          key={i}
          className={`block w-2 h-2 rounded-full border border-ink ${i < remaining ? 'bg-ink' : 'bg-transparent'}`}
          initial={false}
          animate={{ scale: i < remaining ? 1 : 0.85, opacity: i < remaining ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        />
      ))}
    </span>
  )
}

export function ActionList({ state, onAct, hint }: Props) {
  const remaining = state.actionsRemaining
  return (
    <section aria-label="Today's actions">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Today</p>
          <p className="serif text-2xl mt-1">{remaining === 0 ? 'Nothing left to do.' : remaining === ACTIONS_PER_DAY ? 'Pick your battles.' : 'Keep going.'}</p>
        </div>
        <div className="text-right">
          <ActionDots remaining={remaining} />
          <p className="text-[12px] text-muted mt-1.5 tnum">{remaining} action{remaining === 1 ? '' : 's'} remaining</p>
        </div>
      </div>
      {hint && (
        <p className="mt-3 text-[13px] text-muted">
          <span className="mark px-1 text-ink font-medium">You have three actions.</span> Each one changes your state. Then the day ends.
        </p>
      )}

      <ul className="mt-5 border-t hairline">
        {ACTIONS.map((a, i) => {
          const check = canAct(state, a.id)
          const preview = previewAction(state, a.id)
          const used = state.usedToday[a.id] ?? 0
          return (
            <li key={a.id} className="border-b hairline">
              <motion.button
                onClick={() => onAct(a.id)}
                disabled={!check.ok}
                aria-disabled={!check.ok}
                className="group w-full text-left py-3.5 sm:py-4 flex items-start gap-4 press disabled:opacity-40"
                whileHover={check.ok ? { x: 3 } : undefined}
                transition={{ duration: 0.16 }}
              >
                <span className="mt-0.5 text-muted group-hover:text-ink transition-colors" aria-hidden>
                  <Icon name={a.icon} size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[15px]">{a.name}</span>
                    {i < 9 && <kbd className="hidden lg:inline text-[10px] text-faint border hairline rounded px-1 leading-4">{i + 1}</kbd>}
                    {a.maxPerDay && <span className="text-[11px] text-faint tnum">{used}/{a.maxPerDay}</span>}
                    {a.cost !== 1 && <span className="text-[11px] text-faint">{a.cost === 0 ? 'free' : `${a.cost} actions`}</span>}
                  </span>
                  <span className="block text-[13px] text-muted mt-0.5">{a.description}</span>
                  <span className="block mt-1.5">
                    {check.ok || !check.reason ? <EffectList effects={preview} /> : <span className="text-[12px] text-warn font-medium">{check.reason}</span>}
                  </span>
                </span>
                <span className="mt-1 text-faint opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" aria-hidden>
                  <ArrowRight size={16} strokeWidth={1.75} />
                </span>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
