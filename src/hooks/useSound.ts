import { useCallback, useRef } from 'react'

export type SoundKind = 'tick' | 'done' | 'event' | 'bad' | 'unlock' | 'result' | 'big'

/** Tiny WebAudio synth. No assets, nothing autoplays; the context is created on the first gesture. */
export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const ctx = () => {
    if (typeof window === 'undefined') return null
    if (!ctxRef.current) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!C) return null
      ctxRef.current = new C()
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }

  const tone = (c: AudioContext, f: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.05) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(f, c.currentTime + at)
    g.gain.setValueAtTime(0.0001, c.currentTime + at)
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur)
    o.connect(g)
    g.connect(c.destination)
    o.start(c.currentTime + at)
    o.stop(c.currentTime + at + dur + 0.02)
  }

  return useCallback(
    (kind: SoundKind) => {
      if (!enabled) return
      const c = ctx()
      if (!c) return
      try {
        switch (kind) {
          case 'tick': tone(c, 660, 0, 0.05, 'triangle', 0.03); break
          case 'done': tone(c, 523, 0, 0.09, 'triangle', 0.04); tone(c, 784, 0.08, 0.12, 'triangle', 0.04); break
          case 'event': tone(c, 440, 0, 0.08, 'sine', 0.04); tone(c, 554, 0.1, 0.14, 'sine', 0.04); break
          case 'bad': tone(c, 220, 0, 0.12, 'triangle', 0.04); tone(c, 175, 0.1, 0.2, 'triangle', 0.04); break
          case 'unlock': [659, 880, 1175].forEach((f, i) => tone(c, f, i * 0.09, 0.16, 'triangle', 0.045)); break
          case 'result': [523, 659, 784, 1047].forEach((f, i) => tone(c, f, i * 0.12, 0.3, 'sine', 0.05)); break
          case 'big': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(c, f, i * 0.1, 0.35, 'triangle', 0.05)); break
        }
      } catch {
        /* best effort */
      }
    },
    [enabled],
  )
}
