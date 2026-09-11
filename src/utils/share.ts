import type { GameState } from '../types/game'
import { toCgpa } from './scoring'

export function buildShareText(state: GameState): string {
  const r = state.finalResult
  const s = state.stats
  const c = state.counters
  const offer = r && r.salaryLpa > 0 ? `₹${r.salaryLpa} LPA @ ${r.company}` : 'No offer (yet) 😭'
  return [
    '🎓 PLACEMENT SEASON',
    `I survived ${state.day} days.`,
    '',
    `💰 Offer: ${offer}`,
    `🧠 DSA: ${Math.round(s.dsa)}`,
    `📚 CGPA: ${toCgpa(s.cgpa).toFixed(1)}`,
    `💻 Projects: ${Math.round(s.projects)}`,
    `❤️ Mental Health: ${Math.round(s.wellbeing)}`,
    `☕ Coffees: ${c.coffees}`,
    `💀 Breakdowns: ${c.breakdowns}`,
    '',
    `Rating: ${r ? `${r.outcome.emoji} ${r.outcome.title}` : '—'}`,
    '',
    'Can you survive final year? #PlacementSeason',
  ].join('\n')
}

export type ShareOutcome = 'shared' | 'copied' | 'failed'

export async function shareResult(text: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      await navigator.share({ title: 'Placement Season', text })
      return 'shared'
    }
  } catch (err) {
    // user cancelled or share failed — fall through to clipboard
    if ((err as { name?: string })?.name === 'AbortError') return 'failed'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    // last-resort fallback
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok ? 'copied' : 'failed'
    } catch {
      return 'failed'
    }
  }
}
