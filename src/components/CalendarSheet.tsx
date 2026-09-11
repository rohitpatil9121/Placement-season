import { motion } from 'framer-motion'
import { useState } from 'react'
import type { ActionId, DayRecord, GameState, StatKey } from '../types/game'
import { ACTION_MAP } from '../game/actions'
import { PHASES, STAT_LABEL, TOTAL_DAYS, getPhase } from '../game/balance'
import { toCgpa } from '../game/scoring'
import { ACTION_COLOR, PHASE_THEME, STAT_COLOR, alpha } from './theme'
import { Icon, Sheet, fmtDelta } from './ui'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Dots({ actions }: { actions: Partial<Record<ActionId, number>> }) {
  const ids = (Object.entries(actions) as [ActionId, number][]).filter(([, n]) => n > 0)
  return (
    <span className="flex flex-wrap gap-[3px] mt-1" aria-hidden>
      {ids.slice(0, 8).map(([id, n]) => (
        <span key={id} className="w-[6px] h-[6px] rounded-full" style={{ background: ACTION_COLOR[id], opacity: n > 1 ? 1 : 0.85 }} />
      ))}
    </span>
  )
}

export function CalendarSheet({ open, onClose, state }: { open: boolean; onClose: () => void; state: GameState }) {
  const [selected, setSelected] = useState<number | null>(null)
  const byDay = new Map<number, DayRecord>()
  for (const r of state.history) byDay.set(r.day, r)
  const pick = selected ?? Math.max(1, state.day - (state.status === 'dayEnd' ? 0 : 1))
  const rec = byDay.get(pick)
  const todayCount = Object.values(state.usedToday).reduce((a, b) => a + (b ?? 0), 0)

  return (
    <Sheet open={open} onClose={() => { setSelected(null); onClose() }} label="Calendar" width="max-w-4xl" dim={false}>
      <div className="p-6 sm:p-8 grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <p className="eyebrow eyebrow-dot">Calendar</p>
          <p className="serif text-[28px] leading-tight mt-1">Ninety days. This is what you did with them.</p>

          <div className="mt-5 grid grid-cols-7 gap-1.5 text-[10px] tracking-[0.1em] uppercase text-faint">
            {WEEKDAYS.map((d) => <span key={d} className="text-center">{d}</span>)}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5" role="grid" aria-label="Days of the season">
            {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
              const r = byDay.get(d)
              const isToday = d === state.day && state.status !== 'finished'
              const future = d > state.day
              const th = PHASE_THEME[getPhase(d).id]
              const isSel = d === pick
              return (
                <motion.button
                  key={d}
                  role="gridcell"
                  aria-label={`Day ${d}${r ? `, ${Object.values(r.actions).reduce((a, b) => a + (b ?? 0), 0)} things ticked` : future ? ', not yet' : isToday ? ', today' : ''}`}
                  aria-selected={isSel}
                  disabled={future}
                  onClick={() => setSelected(d)}
                  className="press rounded-[10px] p-1.5 text-left min-h-[48px] border-2 disabled:opacity-35"
                  style={{
                    background: future ? 'transparent' : alpha(th.accent, isSel ? 0.35 : 0.14),
                    borderColor: isToday ? th.accent : isSel ? th.ink : 'transparent',
                  }}
                  whileHover={future ? undefined : { y: -1 }}
                >
                  <span className="text-[12px] font-bold tnum leading-none" style={{ color: th.ink }}>{d}</span>
                  {r ? <Dots actions={r.actions} /> : isToday ? <Dots actions={state.usedToday} /> : null}
                  {r && r.offers > 0 && <span className="block mt-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7A5A00' }}>Offer</span>}
                </motion.button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
            {PHASES.slice(0, 4).map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: alpha(PHASE_THEME[p.id].accent, 0.4) }} />{p.name}</span>
            ))}
          </div>
        </div>

        <aside className="lg:border-l hairline lg:pl-8">
          <p className="eyebrow">Day {pick} · {getPhase(pick).name}</p>
          {rec ? (
            <DayDetail rec={rec} />
          ) : pick === state.day && state.status !== 'finished' ? (
            <div className="mt-3">
              <p className="serif text-[22px] leading-tight">Today, so far.</p>
              <ul className="mt-3 space-y-1.5">
                {(Object.entries(state.usedToday) as [ActionId, number][]).filter(([, n]) => n > 0).map(([id, n]) => (
                  <li key={id} className="flex items-center gap-2 text-[14px]">
                    <span className="badge" style={{ background: ACTION_COLOR[id], width: 26, height: 26, borderRadius: 8 }}><Icon name={ACTION_MAP[id].icon} size={13} /></span>
                    {ACTION_MAP[id].name}{n > 1 ? ` ×${n}` : ''}
                  </li>
                ))}
                {todayCount === 0 && <li className="text-[13px] text-muted">Nothing ticked yet.</li>}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Nothing recorded for this day.</p>
          )}
        </aside>
      </div>
    </Sheet>
  )
}

function DayDetail({ rec }: { rec: DayRecord }) {
  const actions = (Object.entries(rec.actions) as [ActionId, number][]).filter(([, n]) => n > 0)
  const deltas = (Object.entries(rec.deltas) as [StatKey, number][]).filter(([k, v]) => k !== 'energy' && Math.abs(v) >= 0.5).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6)
  return (
    <div className="mt-3">
      <p className="serif text-[22px] leading-tight">{actions.length === 0 ? 'A day off. Intentional or not.' : `${actions.reduce((a, [, n]) => a + n, 0)} thing${actions.reduce((a, [, n]) => a + n, 0) === 1 ? '' : 's'} ticked.`}</p>
      <ul className="mt-3 space-y-1.5">
        {actions.map(([id, n]) => (
          <li key={id} className="flex items-center gap-2 text-[14px]">
            <span className="badge" style={{ background: ACTION_COLOR[id], width: 26, height: 26, borderRadius: 8 }}><Icon name={ACTION_MAP[id].icon} size={13} /></span>
            {ACTION_MAP[id].name}{n > 1 ? ` ×${n}` : ''}
          </li>
        ))}
      </ul>
      {rec.events.length > 0 && (
        <>
          <p className="eyebrow mt-5">Happened</p>
          <ul className="mt-1.5 space-y-1 text-[13px]">
            {rec.events.map((e, i) => <li key={i} className="text-ink/85">{e}</li>)}
          </ul>
        </>
      )}
      {deltas.length > 0 && (
        <>
          <p className="eyebrow mt-5">By night</p>
          <ul className="mt-1.5">
            {deltas.map(([k, v]) => (
              <li key={k} className="flex justify-between py-1.5 border-b hairline text-[13px]">
                <span className="inline-flex items-center gap-2 text-muted"><span className="w-2 h-2 rounded-full" style={{ background: STAT_COLOR[k] }} />{STAT_LABEL[k]}</span>
                <span className={`font-semibold tnum ${v > 0 ? 'text-success' : 'text-danger'}`}>{fmtDelta(k, v)}{k === 'cgpa' ? '' : ''}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-faint">CGPA ended the day at {toCgpa(rec.cgpaAfter).toFixed(1)}.</p>
        </>
      )}
    </div>
  )
}
