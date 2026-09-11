import type { Phase } from '../types/game'

export const TOTAL_DAYS = 90
export const ACTIONS_PER_DAY = 3

export const PHASES: Phase[] = [
  {
    id: 'prep',
    name: 'Preparation Arc',
    emoji: '📚',
    from: 1,
    to: 30,
    glow: '124, 92, 252',
    eventChance: 0.3,
    tagline: 'Build fundamentals. Or at least buy the books.',
  },
  {
    id: 'grind',
    name: 'Grind Arc',
    emoji: '🔥',
    from: 31,
    to: 60,
    glow: '251, 146, 60',
    eventChance: 0.42,
    tagline: 'Companies are appearing. So are the nightmares.',
  },
  {
    id: 'placement',
    name: 'Placement Arc',
    emoji: '😰',
    from: 61,
    to: 80,
    glow: '56, 189, 248',
    eventChance: 0.55,
    tagline: 'Interview pressure is a lifestyle now.',
  },
  {
    id: 'boss',
    name: 'Final Boss Arc',
    emoji: '💀',
    from: 81,
    to: 89,
    glow: '251, 113, 133',
    eventChance: 0.7,
    tagline: 'Everything is intense. Including the chai.',
  },
  {
    id: 'day90',
    name: 'Placement Day',
    emoji: '🎓',
    from: 90,
    to: 90,
    glow: '74, 222, 128',
    eventChance: 0,
    tagline: 'After 90 days of chaos...',
  },
]

export function getPhase(day: number): Phase {
  return PHASES.find((p) => day >= p.from && day <= p.to) ?? PHASES[PHASES.length - 1]
}
