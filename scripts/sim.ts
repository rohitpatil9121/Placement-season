/* Headless balance simulation: `npx tsx scripts/sim.ts` */
import type { ActionId, GameState } from '../src/types/game'
import { createInitialState, performAction, resolveEvent, endDay, canPerformAction, checkAchievements } from '../src/utils/gameLogic'
import { toCgpa } from '../src/utils/scoring'

type Strategy = (s: GameState) => ActionId

const needRest = (s: GameState) => s.stats.energy < 25 || s.stats.sleep < 25
const needMood = (s: GameState) => s.stats.wellbeing < 30

const strategies: Record<string, Strategy> = {
  'DSA grinder': (s) => (needRest(s) ? 'deep_sleep' : needMood(s) ? 'chill' : 'grind_dsa'),
  'Academic warrior': (s) => (needRest(s) ? 'deep_sleep' : needMood(s) ? 'chill' : s.day % 3 === 0 ? 'college' : 'study'),
  'Project builder': (s) => (needRest(s) ? 'deep_sleep' : needMood(s) ? 'chill' : s.day % 4 === 0 ? 'resume' : 'project'),
  'Networker': (s) => (needRest(s) ? 'deep_sleep' : needMood(s) ? 'chill' : s.day % 3 === 0 ? 'apply' : s.day % 3 === 1 ? 'resume' : 'network'),
  'Balanced': (s) => {
    if (needRest(s)) return 'deep_sleep'
    if (needMood(s)) return 'chill'
    const cycle: ActionId[] = ['grind_dsa', 'project', 'study', 'grind_dsa', 'mock', 'resume', 'apply', 'network', 'grind_dsa', 'chill']
    return cycle[(s.day * 3 + (3 - s.actionsLeft)) % cycle.length]
  },
  'Sleep only': () => 'deep_sleep',
  'Chaos': (s) => {
    const all: ActionId[] = ['grind_dsa', 'deep_sleep', 'study', 'project', 'mock', 'apply', 'resume', 'network', 'chill', 'college', 'linkedin']
    return all[(s.rngState >>> 3) % all.length]
  },
  'Only DSA no sleep': () => 'grind_dsa',
}

function run(strategy: Strategy, seed: number) {
  let s = createInitialState(seed)
  let guard = 0
  while (s.status === 'playing' && guard++ < 5000) {
    if (s.pendingEvent) {
      const n = s.pendingEvent.event.choices?.length ?? 0
      s = resolveEvent(s, n ? (s.rngState >>> 2) % n : undefined).state
      continue
    }
    if (s.actionsLeft > 0) {
      let a = strategy(s)
      if (!canPerformAction(s, a).ok) a = canPerformAction(s, 'deep_sleep').ok ? 'deep_sleep' : 'chill'
      const r = performAction(s, a)
      if (!r.ok) {
        // fall back: skip to end day
        s = endDay(s).state
      } else s = r.state
      s = checkAchievements(s).state
      continue
    }
    s = endDay(s).state
  }
  if (s.status !== 'finished') throw new Error('did not finish ' + guard)
  return s
}

const seeds = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919)
console.log('strategy'.padEnd(20), 'avg'.padStart(5), 'min'.padStart(4), 'max'.padStart(4), '  dsa  cgpa  proj  intv  well  ach')
for (const [name, strat] of Object.entries(strategies)) {
  const results = seeds.map((seed) => run(strat, seed))
  const scores = results.map((r) => r.finalResult!.score)
  const avg = (k: (r: GameState) => number) => (results.reduce((a, r) => a + k(r), 0) / results.length).toFixed(1)
  console.log(
    name.padEnd(20),
    avg((r) => r.finalResult!.score).padStart(5),
    String(Math.min(...scores)).padStart(4),
    String(Math.max(...scores)).padStart(4),
    ' ',
    avg((r) => r.stats.dsa).padStart(4),
    avg((r) => toCgpa(r.stats.cgpa)).padStart(5),
    avg((r) => r.stats.projects).padStart(5),
    avg((r) => r.stats.interview).padStart(5),
    avg((r) => r.stats.wellbeing).padStart(5),
    avg((r) => r.achievements.length).padStart(4),
  )
}
