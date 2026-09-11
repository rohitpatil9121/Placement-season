import { useState } from 'react'
import { Medal } from 'lucide-react'
import type { BestRuns, Settings } from '../types/game'
import { ACHIEVEMENTS } from '../game/achievements'
import { Sheet } from './ui'

type Props = {
  open: boolean
  onClose: () => void
  settings: Settings
  onChange: (p: Partial<Settings>) => void
  best: BestRuns
  unlocked: string[]
  inRun: boolean
  onNewGame: () => void
  onResetAll: () => void
  tab: 'settings' | 'achievements'
  onTab: (t: 'settings' | 'achievements') => void
}

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b hairline">
      <div>
        <p className="text-[15px] font-medium">{label}</p>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`press relative w-11 h-7 rounded-full shrink-0 transition-colors ${on ? 'bg-ink' : 'bg-line'}`}>
        <span className={`absolute top-1 w-5 h-5 rounded-full bg-surface transition-all ${on ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  )
}

export function SettingsSheet({ open, onClose, settings, onChange, best, unlocked, inRun, onNewGame, onResetAll, tab, onTab: setTab }: Props) {
  const [confirm, setConfirm] = useState<'none' | 'new' | 'all'>('none')
  const got = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).length
  return (
    <Sheet open={open} onClose={() => { setConfirm('none'); onClose() }} label="Settings" dim={false}>
      <div className="p-7 sm:p-9">
        <div className="flex gap-5 text-[13px] tracking-[0.12em] uppercase font-semibold">
          <button onClick={() => setTab('settings')} className={`press pb-1 border-b-2 ${tab === 'settings' ? 'border-ink' : 'border-transparent text-muted'}`}>Settings</button>
          <button onClick={() => setTab('achievements')} className={`press pb-1 border-b-2 ${tab === 'achievements' ? 'border-ink' : 'border-transparent text-muted'}`}>Achievements · {got}/{ACHIEVEMENTS.length}</button>
        </div>

        {tab === 'settings' ? (
          <div className="mt-4">
            <Toggle label="Sound" hint="Small clicks and chimes. Off by default." on={settings.sound} onChange={(v) => onChange({ sound: v })} />
            <Toggle label="Dark mode" hint="Same colours on deep navy." on={settings.dark} onChange={(v) => onChange({ dark: v })} />
            <Toggle label="Reduced motion" hint="Skips transitions, particles and shakes." on={settings.reducedMotion} onChange={(v) => onChange({ reducedMotion: v })} />

            {best.runs > 0 && (
              <>
                <p className="eyebrow mt-7">Best runs</p>
                <ul className="mt-1 text-[14px]">
                  {[
                    ['Runs completed', best.runs],
                    ['Best offer', best.bestSalary > 0 ? `₹${best.bestSalary} LPA` : '—'],
                    ['Best score', best.bestScore],
                    ['Best DSA', best.bestDsa],
                    ['Best CGPA', best.bestCgpa.toFixed(1)],
                    ['Most chaotic run', best.mostChaotic],
                  ].map(([k, v]) => (
                    <li key={String(k)} className="flex justify-between py-2 border-b hairline"><span className="text-muted">{k}</span><span className="font-semibold tnum">{v}</span></li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {confirm === 'none' && (
                <>
                  {inRun && <button onClick={() => setConfirm('new')} className="btn btn-ghost press">New game</button>}
                  <button onClick={() => setConfirm('all')} className="btn press text-muted hover:text-danger">Reset everything</button>
                </>
              )}
              {confirm !== 'none' && (
                <div className="w-full border hairline rounded-md p-4">
                  <p className="text-[14px]">{confirm === 'new' ? 'Abandon this run and start from Day 1?' : 'Delete the save, best runs and achievements?'}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => { confirm === 'new' ? onNewGame() : onResetAll(); setConfirm('none'); onClose() }} className="btn btn-primary press">Yes, do it</button>
                    <button onClick={() => setConfirm('none')} className="btn btn-ghost press">Cancel</button>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-6 text-[11px] text-faint">Progress saves to this browser after every change. Keyboard: 1–9 for actions, E to end the day.</p>
          </div>
        ) : (
          <ul className="mt-4">
            {ACHIEVEMENTS.map((a) => {
              const on = unlocked.includes(a.id)
              return (
                <li key={a.id} className={`flex items-start justify-between gap-4 py-3 border-b hairline ${on ? '' : 'opacity-50'}`}>
                  <div>
                    <p className="font-semibold text-[14px] uppercase tracking-[0.06em]">{a.name}</p>
                    <p className="text-[12px] text-muted">{a.description}</p>
                  </div>
                  <span className={`mt-0.5 w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${on ? '' : 'bg-line'}`} style={on ? { background: '#F5C542', boxShadow: '0 0 0 2px #fff, 0 0 0 3px #F5C542' } : undefined} aria-label={on ? 'Unlocked' : 'Locked'}>{on ? <Medal size={14} strokeWidth={2} color="#3B2A00" /> : null}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Sheet>
  )
}
