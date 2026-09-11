import { Brain, GraduationCap, Heart, Moon, Sparkles, Zap, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { StatKey } from '../types/game'
import { STAT_COLOR } from './theme'

const ICON: Partial<Record<StatKey, LucideIcon>> = {
  energy: Zap, sleep: Moon, dsa: Brain, cgpa: GraduationCap, wellbeing: Heart,
}

/** Stat glyph that reacts to its value: bolt flickers when low, moon yawns, heart beats, brain sparks on gain. */
export function StatIcon({ k, value, delta, size = 16 }: { k: StatKey; value: number; delta?: number; size?: number }) {
  const C = ICON[k] ?? Sparkles
  const [spark, setSpark] = useState(0)
  useEffect(() => {
    if (k === 'dsa' && delta && delta > 0) setSpark((n) => n + 1)
  }, [delta, k])
  const cls =
    k === 'energy' && value < 25 ? 'flicker' :
    k === 'sleep' && value < 30 ? 'yawn' :
    k === 'wellbeing' && value > 85 ? 'beat' :
    k === 'dsa' && spark ? 'spark' : ''
  return (
    <span key={k === 'dsa' ? spark : undefined} className={`inline-flex ${cls}`} style={{ color: STAT_COLOR[k] }} aria-hidden>
      <C size={size} strokeWidth={2} fill={k === 'wellbeing' && value > 85 ? STAT_COLOR[k] : 'none'} />
    </span>
  )
}
