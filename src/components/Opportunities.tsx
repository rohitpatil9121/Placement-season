import type { ApplicationStage, GameState } from '../types/game'
import { COMPANY_MAP } from '../game/companies'
import { eligibilityGaps } from '../game/engine'

const STAGES: ApplicationStage[] = ['applied', 'oa', 'shortlisted', 'interview', 'offer']
const STAGE_LABEL: Record<ApplicationStage, string> = {
  discovered: 'Open', applied: 'Applied', oa: 'Assessment', shortlisted: 'Shortlisted', interview: 'Interview', offer: 'Offer', rejected: 'Rejected',
}

function Pipeline({ stage }: { stage: ApplicationStage }) {
  if (stage === 'discovered') return null
  const idx = stage === 'rejected' ? -1 : STAGES.indexOf(stage)
  return (
    <span className="inline-flex items-center gap-1 mt-2" aria-label={`Stage: ${STAGE_LABEL[stage]}`}>
      {STAGES.map((s, i) => (
        <span key={s} className={`h-[3px] w-5 rounded-full ${stage === 'rejected' ? 'bg-line' : i <= idx ? (stage === 'offer' ? 'bg-success' : 'bg-ink') : 'bg-line'}`} aria-hidden />
      ))}
    </span>
  )
}

export function Opportunities({ state, onApply, onIgnore }: { state: GameState; onApply: (id: string) => void; onIgnore: (id: string) => void }) {
  const apps = [...state.applications].filter((a) => a.stage !== 'rejected' || a.updatedDay >= state.day - 3).reverse()
  if (!apps.length) {
    return (
      <section aria-label="Companies">
        <p className="eyebrow">Companies</p>
        <p className="mt-3 text-[13px] text-muted leading-relaxed">
          {state.day < 20 ? 'Nobody is hiring yet. Enjoy it.' : "You haven't applied anywhere. Bold strategy."}
        </p>
      </section>
    )
  }
  return (
    <section aria-label="Companies">
      <p className="eyebrow">Companies</p>
      <ul className="mt-2">
        {apps.map((a) => {
          const c = COMPANY_MAP[a.companyId]
          const gaps = eligibilityGaps(c, state.stats)
          return (
            <li key={a.companyId} className="py-3 border-b hairline last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[15px] leading-tight">{c.name}</p>
                  <p className="text-[12px] text-muted mt-0.5">{c.role} · ₹{c.packageLpa} LPA</p>
                </div>
                <span className={`text-[11px] tracking-[0.1em] uppercase font-semibold shrink-0 ${a.stage === 'offer' ? 'text-success' : a.stage === 'rejected' ? 'text-faint' : 'text-muted'}`}>
                  {STAGE_LABEL[a.stage]}
                </span>
              </div>
              {a.stage === 'discovered' ? (
                <div className="mt-2">
                  <p className="text-[12px] text-muted italic">{c.tagline}</p>
                  <p className="text-[12px] mt-1 text-muted">
                    Needs {Object.entries(c.eligibility).map(([k, v]) => `${k === 'cgpa' ? 'CGPA' : k[0].toUpperCase() + k.slice(1)} ${k === 'cgpa' ? (v as number).toFixed(1) : v}+`).join(', ')}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    {gaps.length ? (
                      <span className="text-[12px] text-warn font-medium">Not eligible yet · {gaps.join(', ')}</span>
                    ) : (
                      <button onClick={() => onApply(c.id)} className="btn btn-lime press min-h-9 px-3.5 text-[13px]">Apply</button>
                    )}
                    <button onClick={() => onIgnore(c.id)} className="btn press min-h-9 px-2 text-[13px] text-muted hover:text-ink">Skip</button>
                  </div>
                </div>
              ) : (
                <>
                  <Pipeline stage={a.stage} />
                  {a.note && <p className="text-[12px] text-muted mt-1.5">{a.note}</p>}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
