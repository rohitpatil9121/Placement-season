import type { LeaderboardEntry } from '../utils/storage'
import { Modal } from './Modal'

export function Leaderboard({ open, onClose, entries }: { open: boolean; onClose: () => void; entries: LeaderboardEntry[] }) {
  return (
    <Modal open={open} onClose={onClose} title="🏆 Leaderboard" labelledBy="lb-title">
      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted">
          <div className="text-4xl mb-2" aria-hidden>🪑</div>
          <p>No runs yet. The leaderboard is as empty as the placement portal in July.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {entries.map((e, i) => (
            <li key={e.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <span className={`font-display font-bold w-7 text-center ${i === 0 ? 'text-warning' : i === 1 ? 'text-muted' : i === 2 ? 'text-[#CD7F32]' : 'text-muted/70'}`}>
                #{i + 1}
              </span>
              <span className="text-2xl" aria-hidden>{e.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{e.title}</div>
                <div className="text-xs text-muted truncate">
                  {e.salaryLpa > 0 ? `₹${e.salaryLpa} LPA · ${e.company}` : 'No offer'} · DSA {e.dsa} · CGPA {e.cgpa.toFixed(1)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-lg">{e.score}</div>
                <div className="text-[10px] text-muted">{new Date(e.date).toLocaleDateString()}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
