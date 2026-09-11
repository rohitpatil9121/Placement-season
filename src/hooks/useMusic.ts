import { useEffect, useRef } from 'react'
import type { PhaseId } from '../types/game'

/**
 * Synthesized lo-fi background loop. No assets. Starts on the first user gesture
 * (autoplay policy), fades between phase moods, and fully stops when disabled.
 */
type Pattern = { bpm: number; chords: number[][]; bass: number[]; bright: number }

// MIDI note numbers
const P: Record<PhaseId, Pattern> = {
  prep:   { bpm: 76, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], bass: [36, 33, 29, 31], bright: 900 },
  grind:  { bpm: 88, chords: [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 65]], bass: [33, 29, 36, 31], bright: 1200 },
  season: { bpm: 96, chords: [[62, 65, 69, 72], [58, 62, 65, 69], [55, 58, 62, 65], [57, 60, 64, 67]], bass: [38, 34, 31, 33], bright: 1500 },
  final:  { bpm: 104, chords: [[57, 60, 64, 67], [55, 58, 62, 65], [53, 56, 60, 63], [52, 55, 59, 62]], bass: [33, 31, 29, 28], bright: 1800 },
  day90:  { bpm: 84, chords: [[60, 64, 67, 71], [65, 69, 72, 76], [57, 60, 64, 67], [55, 59, 62, 65]], bass: [36, 41, 33, 31], bright: 2200 },
}

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export function useMusic(enabled: boolean, phase: PhaseId) {
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const timerRef = useRef<number | null>(null)
  const phaseRef = useRef<PhaseId>(phase)
  const nextRef = useRef(0)
  const stepRef = useRef(0)
  const startedRef = useRef(false)

  phaseRef.current = phase

  useEffect(() => {
    if (!enabled) {
      stop()
      return
    }
    const onGesture = () => {
      start()
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    // if the context already exists from a previous enable, resume immediately
    if (ctxRef.current) start()
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // phase change: sweep the filter brightness
  useEffect(() => {
    const c = ctxRef.current
    const f = filterRef.current
    if (!c || !f) return
    f.frequency.setTargetAtTime(P[phase].bright, c.currentTime, 1.2)
  }, [phase])

  useEffect(() => () => stop(), [])

  function start() {
    if (startedRef.current) {
      void ctxRef.current?.resume()
      return
    }
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return
    const ctx = ctxRef.current ?? new C()
    ctxRef.current = ctx
    void ctx.resume()
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, ctx.currentTime)
    master.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 2.5)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = P[phaseRef.current].bright
    filter.Q.value = 0.6
    filter.connect(master)
    master.connect(ctx.destination)
    masterRef.current = master
    filterRef.current = filter
    startedRef.current = true
    nextRef.current = ctx.currentTime + 0.1
    stepRef.current = 0
    schedule()
  }

  function stop() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
    const c = ctxRef.current
    const m = masterRef.current
    if (c && m) {
      m.gain.setTargetAtTime(0.0001, c.currentTime, 0.4)
      window.setTimeout(() => {
        try { m.disconnect() } catch { /* already gone */ }
      }, 1500)
    }
    masterRef.current = null
    filterRef.current = null
    startedRef.current = false
  }

  /** Lookahead scheduler: one 16th-note step at a time. */
  function schedule() {
    const ctx = ctxRef.current
    const out = filterRef.current
    if (!ctx || !out || !startedRef.current) return
    const pat = P[phaseRef.current]
    const stepDur = 60 / pat.bpm / 4
    while (nextRef.current < ctx.currentTime + 0.25) {
      const t = nextRef.current
      const step = stepRef.current
      const bar = Math.floor(step / 16) % pat.chords.length
      const inBar = step % 16
      const chord = pat.chords[bar]

      // pad: chord on beat 1, sustained across the bar
      if (inBar === 0) {
        chord.forEach((n, i) => voice(ctx, out, hz(n), t, stepDur * 16 * 0.98, 'triangle', 0.045 - i * 0.006, 0.4))
      }
      // bass: root on 1 and the "and" of 3
      if (inBar === 0 || inBar === 10) voice(ctx, out, hz(pat.bass[bar]), t, stepDur * 5, 'sine', 0.09, 0.02)
      // arpeggio pluck on off-beats, pentatonic-ish from the chord
      if (inBar % 2 === 1 && (step * 7) % 5 !== 0) {
        const n = chord[(step * 3) % chord.length] + (inBar > 8 ? 12 : 0)
        voice(ctx, out, hz(n), t, stepDur * 1.6, 'triangle', 0.03, 0.005)
      }
      // soft hat: noise burst on off-beats
      if (inBar % 4 === 2) hat(ctx, out, t, 0.018)
      // kick-ish thump on 1 and 3
      if (inBar === 0 || inBar === 8) thump(ctx, out, t)

      nextRef.current += stepDur
      stepRef.current += 1
    }
    timerRef.current = window.setTimeout(schedule, 90)
  }
}

function voice(ctx: AudioContext, out: AudioNode, f: number, t: number, dur: number, type: OscillatorType, gain: number, attack: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  o.detune.setValueAtTime((Math.random() - 0.5) * 6, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
}

let noiseBuf: AudioBuffer | null = null
function hat(ctx: AudioContext, out: AudioNode, t: number, gain: number) {
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  }
  const s = ctx.createBufferSource()
  s.buffer = noiseBuf
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
  s.connect(hp)
  hp.connect(g)
  g.connect(out)
  s.start(t)
  s.stop(t + 0.1)
}

function thump(ctx: AudioContext, out: AudioNode, t: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(110, t)
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
  g.gain.setValueAtTime(0.12, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  o.connect(g)
  g.connect(out)
  o.start(t)
  o.stop(t + 0.2)
}
