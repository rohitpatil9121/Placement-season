import { useCallback, useRef } from 'react'

export type SoundKind = 'click' | 'success' | 'error' | 'achievement' | 'celebrate' | 'event' | 'legendary'

/**
 * Tiny WebAudio synth so the game needs no audio assets.
 * Nothing autoplays: the AudioContext is created lazily on the first user gesture.
 */
export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = () => {
    if (typeof window === 'undefined') return null
    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctxRef.current = new Ctor()
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }

  const tone = (ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
    g.gain.setValueAtTime(0.0001, ctx.currentTime + start)
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(ctx.currentTime + start)
    osc.stop(ctx.currentTime + start + dur + 0.02)
  }

  const play = useCallback(
    (kind: SoundKind) => {
      if (!enabled) return
      const ctx = getCtx()
      if (!ctx) return
      try {
        switch (kind) {
          case 'click':
            tone(ctx, 520, 0, 0.06, 'triangle', 0.05)
            break
          case 'success':
            tone(ctx, 523, 0, 0.1, 'triangle')
            tone(ctx, 784, 0.08, 0.14, 'triangle')
            break
          case 'error':
            tone(ctx, 220, 0, 0.12, 'sawtooth', 0.05)
            tone(ctx, 160, 0.1, 0.18, 'sawtooth', 0.05)
            break
          case 'event':
            tone(ctx, 440, 0, 0.08, 'square', 0.03)
            tone(ctx, 660, 0.09, 0.12, 'square', 0.03)
            break
          case 'achievement':
            tone(ctx, 659, 0, 0.1, 'triangle')
            tone(ctx, 880, 0.1, 0.1, 'triangle')
            tone(ctx, 1175, 0.2, 0.2, 'triangle')
            break
          case 'legendary':
            ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(ctx, f, i * 0.08, 0.25, 'triangle', 0.07))
            break
          case 'celebrate':
            ;[523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(ctx, f, i * 0.11, 0.3, 'triangle', 0.08))
            break
        }
      } catch {
        /* audio is best-effort */
      }
    },
    [enabled],
  )

  return play
}
