import { motion } from 'framer-motion'
import type { GameState } from '../types/game'
import { COMPANY_MAP, QUESTION_MAP } from '../game/companies'
import { Sheet } from './ui'

export function InterviewSheet({ state, onAnswer, onClose }: { state: GameState; onAnswer: (i: number) => void; onClose: () => void }) {
  const iv = state.interview
  const c = iv ? COMPANY_MAP[iv.companyId] : null
  const q = iv && !iv.outcome ? QUESTION_MAP[iv.questionIds[iv.index]] : null
  return (
    <Sheet open={!!iv} dim label={c ? `Interview at ${c.name}` : 'Interview'} width="max-w-xl">
      {iv && c && (
        <div className="p-7 sm:p-10">
          <p className="eyebrow">Interview · {c.name} · {c.role}</p>
          {q ? (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {iv.lastReply && <p className="mt-4 text-[13px] text-muted italic">{iv.lastReply}</p>}
                <p className="mt-5 text-[11px] tracking-[0.14em] uppercase text-faint tnum">Question {iv.index + 1} of {iv.questionIds.length}</p>
                <p className="serif text-[30px] sm:text-[36px] leading-tight mt-2">“{q.prompt}”</p>
                <ul className="mt-7 border-t hairline">
                  {q.options.map((o, i) => (
                    <li key={o.label} className="border-b hairline">
                      <motion.button onClick={() => onAnswer(i)} className="w-full text-left py-3.5 press group flex justify-between gap-4" whileHover={{ x: 3 }} transition={{ duration: 0.16 }}>
                        <span className="text-[15px]">{o.label}</span>
                        <span className="text-faint opacity-0 group-hover:opacity-100" aria-hidden>→</span>
                      </motion.button>
                    </li>
                  ))}
                </ul>
              </motion.div>
          ) : (
              <motion.div key="outcome" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                {iv.lastReply && <p className="mt-4 text-[13px] text-muted italic">{iv.lastReply}</p>}
                <p className="serif text-[44px] sm:text-[56px] leading-none mt-6">
                  {iv.outcome === 'offer' ? <>Offer<span className="mark px-1">.</span></> : 'Not this one.'}
                </p>
                <p className="mt-4 text-[16px] text-ink/85 max-w-prose">
                  {iv.outcome === 'offer'
                    ? `${c.name} wants you. ${c.role}, ₹${c.packageLpa} LPA. You read the mail three times. Then you send it to family.`
                    : `${c.name} will "get back to you". They will not. You go get chai. It helps a little.`}
                </p>
                <button onClick={onClose} className="btn btn-primary press mt-8">Continue <span aria-hidden>→</span></button>
              </motion.div>
          )}
        </div>
      )}
    </Sheet>
  )
}
