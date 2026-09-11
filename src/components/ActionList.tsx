import { motion } from 'framer-motion'
import { ArrowRight, Check, Flame } from 'lucide-react'
import type { ActionId, GameState } from '../types/game'
import { ACTIONS } from '../game/actions'
import { ACTIONS_PER_DAY } from '../game/balance'
import { canAct, previewAction } from '../game/engine'
import { EffectList, Icon } from './ui'
import { ACTION_COLOR, GOLD } from './theme'
import { FloatingDeltas } from './FloatingDeltas'
import type { Effects, StreakKey } from '../types/game'
import { STREAK_BONUS_AT } from '../game/balance'

type Props = { state: GameState; onAct: (id: ActionId) => void; hint: boolean; deltas: Effects; nonce: number; onPeek?: (e: Effects | null) => void; onFocus?: (k: SkillKey) => void }
import type { SkillKey } from '../types/game'
import { SKILL_LIST, isExamWeek } from '../game/balance'

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

export function ActionList({ state, onAct, hint, deltas, nonce, onPeek, onFocus }: Props) {
  const ticked = Object.values(state.usedToday).reduce((a, b) => a + (b ?? 0), 0)
  return (
    <section aria-label="Today's actions" className="relative">
      <FloatingDeltas deltas={deltas} nonce={nonce} />
      <div className="flex items-baseline justify-between">
        <div>
          <p className="eyebrow eyebrow-dot">Today's list</p>
          <p className="serif text-3xl sm:text-4xl mt-1">{ticked === 0 ? 'What are you doing today?' : ticked >= ACTIONS.length ? 'Everything ticked. End the day.' : `${ticked} ticked. Keep going or end the day.`}</p>
        </div>
      </div>
      {hint && (
        <p className="mt-3 text-[13px] text-muted">
          <span className="mark px-1 text-ink font-medium">Tick anything, once a day.</span> Each one changes your state. End the day whenever you like.
        </p>
      )}

      <ul className="mt-5 flex flex-col gap-2" role="list" aria-label="Today's to-do list">
        {ACTIONS.map((a, i) => {
          const check = canAct(state, a.id)
          const preview = previewAction(state, a.id)
          const used = state.usedToday[a.id] ?? 0
          const done = used > 0
          const color = ACTION_COLOR[a.id]
          return (
            <li key={a.id} style={{ ['--tile' as string]: color }}>
              <motion.button
                onClick={() => onAct(a.id)}
                onMouseEnter={() => check.ok && onPeek?.(preview)}
                onMouseLeave={() => onPeek?.(null)}
                onFocus={() => check.ok && onPeek?.(preview)}
                onBlur={() => onPeek?.(null)}
                disabled={!check.ok}
                aria-disabled={!check.ok}
                aria-label={`${a.name}${done ? `, done ${used} time${used === 1 ? '' : 's'} today` : ''}`}
                className={`tile group w-full text-left px-3.5 py-3 flex items-center gap-3.5 disabled:opacity-45 ${done ? 'is-done' : ''}`}
                style={done ? { background: `color-mix(in srgb, ${color} 16%, var(--color-surface))`, borderColor: color } : undefined}
                layout
              >
                {/* checkbox */}
                <motion.span
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: color, background: done ? color : 'transparent', color: '#fff' }}
                  initial={false}
                  animate={{ scale: done ? [1, 1.25, 1] : 1 }}
                  transition={{ duration: 0.35 }}
                  aria-hidden
                >
                  {done ? <Check size={16} strokeWidth={3} /> : <span className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-60 transition-opacity" style={{ background: color }} />}
                </motion.span>
                <span className="badge" style={{ background: color, width: 36, height: 36, borderRadius: 11 }} aria-hidden>
                  <Icon name={a.icon} size={17} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-[16px] sm:text-[17px] ${done ? 'line-through decoration-2' : ''}`} style={done ? { textDecorationColor: color } : undefined}>{a.name}</span>
                    {done && <span className="text-[11px] font-bold tnum rounded-full px-1.5 py-0.5 text-white" style={{ background: color }}>done{used > 1 ? ` ×${used}` : ''}</span>}
                    {a.maxPerDay && a.maxPerDay > 1 && !done && <span className="text-[11px] text-faint tnum">up to {a.maxPerDay}</span>}
                    {i < 9 && <kbd className="hidden lg:inline text-[10px] text-faint border hairline rounded px-1 leading-4">{i + 1}</kbd>}
                    {STREAK_OF[a.id] && state.streaks[STREAK_OF[a.id]!] >= 2 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-1.5 py-0.5 tnum" style={{ background: 'rgba(255,176,32,0.18)', color: '#9A5B00' }}>
                        <Flame size={11} strokeWidth={2.2} fill={state.streaks[STREAK_OF[a.id]!] >= STREAK_BONUS_AT ? '#FFB020' : 'none'} /> {state.streaks[STREAK_OF[a.id]!]}-day streak
                      </span>
                    )}
                  </span>
                  <span className="block text-[13px] text-muted mt-0.5 leading-snug truncate">{a.id === 'study' && isExamWeek(state.day) ? 'Mid-sems. Counts double this week.' : a.description}</span>
                  {a.id === 'dsa' && (
                    <span className="flex flex-wrap gap-1.5 mt-2" role="radiogroup" aria-label="DSA topic to practise" onClick={(e) => e.stopPropagation()}>
                      {SKILL_LIST.map((sk) => {
                        const on = state.focus === sk.key
                        return (
                          <span
                            key={sk.key}
                            role="radio"
                            aria-checked={on}
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); onFocus?.(sk.key) }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onFocus?.(sk.key) } }}
                            className="press cursor-pointer inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold border tnum"
                            style={{ background: on ? color : 'transparent', color: on ? '#fff' : color, borderColor: color }}
                          >
                            {sk.short} <span className="opacity-80">{Math.round(state.skills[sk.key])}</span>
                          </span>
                        )
                      })}
                    </span>
                  )}
                </span>
                <span className="hidden sm:block text-right shrink-0">
                  {check.ok || !check.reason ? <EffectList effects={preview} /> : <span className="text-[12px] text-warn font-medium">{check.reason}</span>}
                </span>
                
                <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0" style={{ color }} aria-hidden>
                  {done && check.ok ? <span className="text-[11px] font-semibold">again</span> : !done ? <ArrowRight size={16} strokeWidth={2} /> : null}
                </span>
              </motion.button>
              <div className="sm:hidden px-3.5 pt-1.5">
                {check.ok || !check.reason ? <EffectList effects={preview} /> : <span className="text-[12px] text-warn font-medium">{check.reason}</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
