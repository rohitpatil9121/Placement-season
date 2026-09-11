import type { GameState } from '../types/game'
import { toCgpa } from '../game/scoring'

export function shareText(state: GameState): string {
  const r = state.result
  const s = state.stats
  const m = state.metrics
  const offer = r?.placed ? `₹${r.salaryLpa} LPA · ${r.role}${r.company ? ` · ${r.company}` : ''}` : 'Not placed. Yet.'
  return [
    'PLACEMENT SEASON — 90 DAYS',
    '',
    offer,
    '',
    `DSA ${Math.round(s.dsa)}  ·  CGPA ${toCgpa(s.cgpa).toFixed(1)}  ·  Projects ${Math.round(s.projects)}  ·  Interview ${Math.round(s.interview)}`,
    `Coffee ${m.coffees}  ·  Applications ${m.applicationsSent}  ·  Sleep sacrificed ${m.sleepSacrificed} nights`,
    '',
    `"${closingLine(r?.score ?? 0)}"`,
  ].join('\n')
}

export function closingLine(score: number): string {
  if (score >= 86) return 'Annoyingly competent.'
  if (score >= 71) return 'Somehow, we made it.'
  if (score >= 56) return 'Not bad. Not bad at all.'
  if (score >= 41) return 'A start is a start.'
  if (score >= 26) return 'The off-campus arc begins.'
  return 'Placement season won this round.'
}

export type ShareOutcome = 'shared' | 'copied' | 'failed'

export async function share(text: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && /Mobi|Android/i.test(navigator.userAgent)) {
      await navigator.share({ title: 'Placement Season', text })
      return 'shared'
    }
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return 'failed'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
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
