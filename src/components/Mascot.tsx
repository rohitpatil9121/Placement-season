import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Stats } from '../types/game'

export type Mood = 'fresh' | 'tired' | 'dead' | 'hyped' | 'celebrate' | 'worried'

export function moodFor(s: Stats): Mood {
  if (s.wellbeing < 20) return 'dead'
  if (s.sleep < 25) return 'tired'
  if (s.wellbeing > 85 && s.sleep > 60) return 'hyped'
  if (s.wellbeing < 40) return 'worried'
  return 'fresh'
}

export const MOOD_LINE: Record<Mood, string> = {
  fresh: 'Doing fine. For now.',
  tired: 'Running on chai and hope.',
  dead: 'Send help. Or samosas.',
  hyped: 'Suspiciously well-rested.',
  celebrate: 'Screenshot. Send to family.',
  worried: 'One LinkedIn post from crying.',
}

type Props = { mood: Mood; bump?: number; size?: number; className?: string; skin?: string; shirt?: string }

/**
 * Simple vector student. Head, hair, eyes, mouth, shirt. The face is driven by mood;
 * `bump` changes trigger a small bounce.
 */
export function Mascot({ mood, bump = 0, size = 96, className = '', skin = '#F2C7A5', shirt = 'var(--phase-accent, #2FBF9A)' }: Props) {
  const reduced = useReducedMotion()
  const [wobble, setWobble] = useState(0)
  useEffect(() => {
    if (!bump) return
    setWobble((w) => w + 1)
  }, [bump])

  const eyes = {
    fresh: { ry: 3.2, y: 0 },
    hyped: { ry: 4, y: -1 },
    tired: { ry: 1.3, y: 1 },
    dead: { ry: 0.8, y: 1.5 },
    worried: { ry: 2.8, y: 0.5 },
    celebrate: { ry: 1.2, y: -1 },
  }[mood]

  const mouth = {
    fresh: 'M42 66 Q50 71 58 66',
    hyped: 'M40 64 Q50 76 60 64',
    tired: 'M43 68 Q50 66 57 68',
    dead: 'M43 70 Q50 65 57 70',
    worried: 'M43 69 Q50 64 57 69',
    celebrate: 'M39 63 Q50 79 61 63',
  }[mood]

  const anim =
    reduced
      ? undefined
      : mood === 'celebrate'
        ? { y: [0, -10, 0, -6, 0], rotate: [0, -4, 4, -2, 0] }
        : mood === 'hyped'
          ? { y: [0, -3, 0] }
          : mood === 'dead'
            ? { rotate: [0, 1.5, 0, -1.5, 0] }
            : { y: [0, -1.5, 0] }

  return (
    <motion.svg
      key={wobble}
      width={size}
      height={size}
      viewBox="0 0 100 110"
      className={className}
      role="img"
      aria-label={`Your character looks ${mood === 'dead' ? 'exhausted' : mood}`}
      initial={reduced ? false : { scale: 0.92, rotate: -3 }}
      animate={reduced ? undefined : { scale: 1, rotate: 0, ...anim }}
      transition={reduced ? undefined : { scale: { type: 'spring', stiffness: 400, damping: 14 }, rotate: { type: 'spring', stiffness: 300, damping: 12 }, y: { repeat: Infinity, duration: mood === 'celebrate' ? 0.9 : 2.6, ease: 'easeInOut' } }}
    >
      {/* shirt */}
      <path d="M22 108 C22 86 34 80 50 80 C66 80 78 86 78 108 Z" fill={shirt} />
      <path d="M44 80 L50 92 L56 80 Z" fill="#fff" opacity="0.9" />
      {/* neck */}
      <rect x="44" y="70" width="12" height="12" rx="4" fill={skin} />
      {/* head */}
      <rect x="26" y="22" width="48" height="52" rx="18" fill={skin} />
      {/* hair */}
      <path d="M26 42 C24 20 40 12 52 14 C66 15 76 22 74 40 C68 32 60 30 50 32 C42 33 34 34 26 42 Z" fill="#2B2320" />
      {mood === 'hyped' || mood === 'celebrate' ? <path d="M40 14 L44 6 L48 14 M54 13 L58 5 L62 13" stroke="#2B2320" strokeWidth="3" fill="none" strokeLinecap="round" /> : null}
      {/* glasses */}
      <g stroke="#2B2320" strokeWidth="2.2" fill="none">
        <rect x="31" y="44" width="15" height="11" rx="4" />
        <rect x="54" y="44" width="15" height="11" rx="4" />
        <path d="M46 49 L54 49" />
      </g>
      {/* eyes */}
      <ellipse cx="38.5" cy={49.5 + eyes.y} rx="2.6" ry={eyes.ry} fill="#2B2320" />
      <ellipse cx="61.5" cy={49.5 + eyes.y} rx="2.6" ry={eyes.ry} fill="#2B2320" />
      {mood === 'dead' && (
        <g stroke="#6C7BFF" strokeWidth="2" strokeLinecap="round">
          <path d="M33 58 L33 63" />
          <path d="M67 58 L67 63" />
        </g>
      )}
      {mood === 'worried' && <path d="M33 41 L43 44 M67 41 L57 44" stroke="#2B2320" strokeWidth="2" strokeLinecap="round" />}
      {/* cheeks */}
      {(mood === 'hyped' || mood === 'celebrate' || mood === 'fresh') && (
        <g fill="#FF6B8A" opacity="0.35">
          <circle cx="34" cy="60" r="3.5" />
          <circle cx="66" cy="60" r="3.5" />
        </g>
      )}
      {/* mouth */}
      <path d={mouth} stroke="#2B2320" strokeWidth="2.4" fill={mood === 'hyped' || mood === 'celebrate' ? '#2B2320' : 'none'} strokeLinecap="round" />
      {/* coffee cup for tired */}
      {mood === 'tired' && (
        <g>
          <rect x="70" y="84" width="14" height="14" rx="3" fill="#fff" stroke="#2B2320" strokeWidth="2" />
          <path d="M84 88 h4 a3 3 0 0 1 0 6 h-4" stroke="#2B2320" strokeWidth="2" fill="none" />
          <path d="M74 80 q2 -3 0 -6 M78 80 q2 -3 0 -6" stroke="#A3A29C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      )}
    </motion.svg>
  )
}

/** The interviewer: a second character with a reactive face. */
export function Interviewer({ reaction, size = 88 }: { reaction: 'neutral' | 'impressed' | 'bored' | 'concerned'; size?: number }) {
  const mouth = { neutral: 'M42 66 L58 66', impressed: 'M41 63 Q50 73 59 63', bored: 'M42 68 Q50 66 58 68', concerned: 'M42 69 Q50 63 58 69' }[reaction]
  const brow = { neutral: '', impressed: 'M32 40 Q38 36 44 40 M56 40 Q62 36 68 40', bored: 'M32 41 L44 41 M56 41 L68 41', concerned: 'M32 38 L44 42 M68 38 L56 42' }[reaction]
  return (
    <motion.svg width={size} height={size} viewBox="0 0 100 110" role="img" aria-label={`Interviewer looks ${reaction}`} key={reaction} initial={{ scale: 0.94 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 16 }}>
      <path d="M20 108 C20 84 34 78 50 78 C66 78 80 84 80 108 Z" fill="#1F2937" />
      <path d="M50 78 L46 90 L50 108 L54 90 Z" fill="#F5C542" />
      <rect x="44" y="68" width="12" height="12" rx="4" fill="#D9A583" />
      <rect x="26" y="20" width="48" height="52" rx="18" fill="#D9A583" />
      <path d="M26 36 C28 16 44 12 56 14 C68 16 76 24 74 34 C64 28 40 28 26 36 Z" fill="#3B2F2A" />
      <ellipse cx="38.5" cy="49" rx="2.5" ry={reaction === 'bored' ? 1.4 : 3} fill="#2B2320" />
      <ellipse cx="61.5" cy="49" rx="2.5" ry={reaction === 'bored' ? 1.4 : 3} fill="#2B2320" />
      {brow && <path d={brow} stroke="#2B2320" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      <path d={mouth} stroke="#2B2320" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </motion.svg>
  )
}
