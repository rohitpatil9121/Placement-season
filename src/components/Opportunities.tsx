import { motion } from 'framer-motion'
import type { ApplicationStage, GameState } from '../types/game'
import { COMPANIES, COMPANY_MAP } from '../game/companies'
import { eligibilityGaps } from '../game/engine'
import { GOLD, TIER_COLOR, alpha } from './theme'
import { SKILL_LABEL } from '../game/balance'

const STAGES: ApplicationStage[] = ['applied', 'oa', 'shortlisted', 'interview', 'offer']
const STAGE_LABEL: Record<ApplicationStage, string> = {
  discovered: 'Open', applied: 'Applied', oa: 'Assessment', shortlisted: 'Shortlisted', interview: 'Interview', offer: 'Offer', rejected: 'Rejected',
}

/** Logo mark generated from initials. */
function Mark({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="inline-flex items-center justify-center rounded-[12px] font-bold text-white shrink-0 select-none" style={{ width: size, height: size, background: color, fontSize: size * 0.36, letterSpacing: '0.02em', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.16)' }} aria-hidden>
      {initials}
    </span>
  )
}

function Pipeline({ stage, color }: { stage: ApplicationStage; color: string }) {
  if (stage === 'discovered') return null
  const idx = stage === 'rejected' ? -1 : STAGES.indexOf(stage)
  return (
    <span className="inline-flex items-center gap-1 mt-2.5" aria-label={`Stage: ${STAGE_LABEL[stage]}`}>
      {STAGES.map((s, i) => (
        <motion.span key={s} className="h-[4px] w-6 rounded-full" initial={false} animate={{ background: stage === 'rejected' ? 'var(--color-line)' : i <= idx ? (stage === 'offer' ? GOLD : color) : 'var(--color-line)' }} transition={{ duration: 0.3, delay: i * 0.05 }} aria-hidden />
      ))}
    </span>
  )
}

export function Opportunities({ state, onApply, onIgnore, live }: { state: GameState; onApply: (id: string) => void; onIgnore: (id: string) => void; live?: { updatedAt: string | null; source: string } }) {
  const apps = [...state.applications].filter((a) => a.stage !== 'rejected' || a.updatedDay >= state.day - 3).reverse()
  const known = new Set(state.applications.map((a) => a.companyId))
  const upcoming = COMPANIES.filter((c) => !known.has(c.id) && c.appearsTo >= state.day).sort((a, b) => a.appearsFrom - b.appearsFrom).slice(0, 5)
  const stamp = live?.updatedAt ? `Data updated ${live.updatedAt}${live.source === 'remote' ? ' · live from GitHub' : ''}.` : 'Bundled data.'
  const disclaimer = <p className="mt-4 text-[11px] text-faint leading-relaxed">{stamp} Real employers; packages are approximate base pay from publicly reported fresher offers and change every year. Roles and dates are simplified.</p>
  if (!apps.length) {
    return (
      <section aria-label="Companies" className="panel p-5">
        <p className="eyebrow eyebrow-dot">Companies</p>
        <p className="mt-3 text-[13px] text-muted leading-relaxed">
          {state.day < 20 ? 'Nobody is hiring yet. Here is who usually turns up.' : "You haven't applied anywhere. Bold strategy. Still to come:"}
        </p>
        <ul className="mt-3 divide-y hairline">
          {upcoming.map((c) => (
            <li key={c.id} className="py-2 flex items-center gap-3">
              <Mark name={c.name} color={TIER_COLOR[c.tier]} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-tight">{c.name} <span className="text-muted font-normal">· ₹{c.packageLpa} LPA</span></span>
                <span className="block text-[11px] text-faint">Needs {Object.entries(c.eligibility).map(([k, v]) => `${k === 'cgpa' ? 'CGPA' : k[0].toUpperCase() + k.slice(1)} ${k === 'cgpa' ? (v as number).toFixed(1) : v}+`).join(' · ')}</span>
              </span>
              <span className="text-[11px] tnum text-muted shrink-0">{c.appearsFrom <= state.day ? 'any day' : `Day ${c.appearsFrom}+`}</span>
            </li>
          ))}
        </ul>
        {disclaimer}
      </section>
    )
  }
  return (
    <section aria-label="Companies" className="panel p-5">
      <p className="eyebrow eyebrow-dot">Companies</p>
      <ul className="mt-3 space-y-3">
        {apps.map((a) => {
          const c = COMPANY_MAP[a.companyId]
          const gaps = eligibilityGaps(c, state.stats)
          const color = TIER_COLOR[c.tier]
          const offer = a.stage === 'offer'
          const dead = a.stage === 'rejected'
          return (
            <motion.li
              key={`${a.companyId}-${a.stage}`}
              className={`card relative overflow-hidden p-3.5 ${dead ? 'opacity-55' : ''}`}
              style={{ perspective: 800, borderColor: offer ? GOLD : undefined, boxShadow: offer ? `0 0 0 3px ${alpha(GOLD, 0.35)}` : undefined }}
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: offer ? GOLD : color }} aria-hidden />
              <div className="flex items-start gap-3 pl-1.5">
                <Mark name={c.name} color={offer ? GOLD : color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-[17px] leading-tight">{c.name}</p>
                    <span className="text-[10px] tracking-[0.12em] uppercase font-bold shrink-0 rounded-full px-2 py-0.5" style={{ background: offer ? GOLD : dead ? 'var(--color-line)' : alpha(color, 0.15), color: offer ? '#3B2A00' : dead ? 'var(--color-muted)' : color }}>
                      {STAGE_LABEL[a.stage]}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted mt-0.5">{c.role} · <span className="font-semibold text-ink tnum">₹{c.packageLpa} LPA</span></p>
                  {c.asks?.length ? <p className="text-[11px] mt-1" style={{ color: '#6D3FD6' }}>Asks: {c.asks.map((k) => SKILL_LABEL[k]).join(', ')}</p> : null}
                  {a.stage === 'discovered' ? (
                    <div className="mt-2">
                      <p className="text-[12px] text-muted italic">{c.tagline}</p>
                      <p className="text-[11px] mt-1 text-faint">
                        Needs {Object.entries(c.eligibility).map(([k, v]) => `${k === 'cgpa' ? 'CGPA' : k[0].toUpperCase() + k.slice(1)} ${k === 'cgpa' ? (v as number).toFixed(1) : v}+`).join(' · ')}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        {gaps.length ? (
                          <span className="text-[12px] text-warn font-medium">Not eligible yet · {gaps.join(', ')}</span>
                        ) : (
                          <button onClick={() => onApply(c.id)} className="btn press min-h-9 px-3.5 text-[13px] text-white" style={{ background: color }}>Apply</button>
                        )}
                        <button onClick={() => onIgnore(c.id)} className="btn press min-h-9 px-2 text-[13px] text-muted hover:text-ink">Skip</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Pipeline stage={a.stage} color={color} />
                      {a.note && <p className="text-[12px] text-muted mt-1.5">{a.note}</p>}
                    </>
                  )}
                </div>
              </div>
            </motion.li>
          )
        })}
      </ul>
      {upcoming.length > 0 && (
        <p className="mt-3 text-[12px] text-muted">Still to come: {upcoming.map((c) => c.name).join(', ')}.</p>
      )}
      {disclaimer}
    </section>
  )
}
