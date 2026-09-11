import { ACHIEVEMENTS } from '../data/achievements'
import { Modal } from './Modal'

export function AchievementsModal({ open, onClose, unlocked }: { open: boolean; onClose: () => void; unlocked: string[] }) {
  const count = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).length
  return (
    <Modal open={open} onClose={onClose} title={`🏅 Achievements · ${count}/${ACHIEVEMENTS.length}`} labelledBy="ach-title" size="lg">
      <ul className="grid sm:grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.includes(a.id)
          const hidden = a.secret && !got
          return (
            <li key={a.id} className={`glass rounded-2xl p-3 flex items-center gap-3 ${got ? 'border-warning/40' : 'opacity-60'}`}>
              <span className={`text-2xl ${got ? '' : 'grayscale'}`} aria-hidden>{hidden ? '❓' : a.emoji}</span>
              <div className="min-w-0">
                <div className="font-semibold text-sm">{hidden ? '???' : a.name}</div>
                <div className="text-xs text-muted">{hidden ? 'Secret achievement. Keep suffering.' : a.description}</div>
              </div>
              <span className="ml-auto text-xs font-bold shrink-0" aria-label={got ? 'Unlocked' : 'Locked'}>
                {got ? '✅' : '🔒'}
              </span>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
