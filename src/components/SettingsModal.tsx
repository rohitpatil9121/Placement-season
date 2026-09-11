import { useState } from 'react'
import type { Settings } from '../types/game'
import { Modal } from './Modal'

type Props = {
  open: boolean
  onClose: () => void
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onResetGame: () => void
  onResetEverything: () => void
  onContinue?: () => void
  inGame: boolean
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="glass rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer min-h-12">
      <span>
        <span className="font-semibold text-sm block">{label}</span>
        <span className="text-xs text-muted">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`focus-ring relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-white/15'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  )
}

export function SettingsModal({ open, onClose, settings, onChange, onResetGame, onResetEverything, onContinue, inGame }: Props) {
  const [confirm, setConfirm] = useState<'none' | 'game' | 'all'>('none')
  const btn = 'focus-ring min-h-12 rounded-2xl px-4 font-display font-bold tracking-wider text-sm'
  return (
    <Modal open={open} onClose={onClose} title="⚙️ Settings" labelledBy="settings-title">
      <div className="space-y-2.5">
        <Toggle label="Sound" hint="Tiny synth blips. No assets, no autoplay." checked={settings.sound} onChange={(v) => onChange({ sound: v })} />
        <Toggle label="Music" hint="Lo-fi placement beats (there are none — your imagination is the soundtrack)." checked={settings.music} onChange={(v) => onChange({ music: v })} />
        <Toggle label="Reduced motion" hint="Disables shakes, confetti and most animation." checked={settings.reducedMotion} onChange={(v) => onChange({ reducedMotion: v })} />
      </div>

      <div className="mt-5 grid gap-2">
        {inGame && onContinue && (
          <button onClick={onContinue} className={`${btn} bg-primary text-white`}>
            CONTINUE GAME
          </button>
        )}
        {confirm === 'none' && (
          <>
            <button onClick={() => setConfirm('game')} className={`${btn} glass hover:border-danger/50`}>
              RESET GAME
            </button>
            <button onClick={() => setConfirm('all')} className={`${btn} glass text-muted hover:border-danger/50`}>
              RESET EVERYTHING (leaderboard + achievements)
            </button>
          </>
        )}
        {confirm !== 'none' && (
          <div className="glass rounded-2xl p-3 border-danger/40">
            <p className="text-sm text-muted mb-2">
              {confirm === 'game' ? 'Delete the current save? Placement season restarts from Day 1.' : 'Delete save, leaderboard and all achievements? This cannot be undone.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm === 'game') onResetGame()
                  else onResetEverything()
                  setConfirm('none')
                  onClose()
                }}
                className={`${btn} flex-1 bg-danger text-white`}
              >
                YES, DELETE
              </button>
              <button onClick={() => setConfirm('none')} className={`${btn} flex-1 glass`}>
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-[11px] text-muted text-center">Progress auto-saves to your browser after every action.</p>
    </Modal>
  )
}
