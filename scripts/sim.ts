/* Headless balance simulation: `npx tsx scripts/sim.ts` */
import type { ActionId, GameState } from '../src/types/game'
import { createGame, performAction, applyEvent, endDay, startDay, canAct, unlockAchievements, applyToCompany, answerInterview, closeInterview, eligibilityGaps, setFocus, acknowledgeWeek } from '../src/game/engine'
import { COMPANY_MAP } from '../src/game/companies'
import { toCgpa } from '../src/game/scoring'

type Strategy = (s: GameState) => ActionId
const tired = (s: GameState) => s.stats.energy < 25 || s.stats.sleep < 25
const sad = (s: GameState) => s.stats.wellbeing < 30

const strategies: Record<string, Strategy> = {
  'The Grinder': (s) => (tired(s) ? 'sleep' : sad(s) ? 'chill' : 'dsa'),
  'Academic Weapon': (s) => (tired(s) ? 'sleep' : sad(s) ? 'chill' : s.day % 3 === 0 ? 'college' : 'study'),
  'The Builder': (s) => (tired(s) ? 'sleep' : sad(s) ? 'chill' : s.day % 4 === 0 ? 'resume' : 'project'),
  'The Networker': (s) => (tired(s) ? 'sleep' : sad(s) ? 'chill' : s.day % 3 === 0 ? 'apply' : s.day % 3 === 1 ? 'resume' : 'network'),
  'Balanced': (s) => {
    if (tired(s)) return 'sleep'
    if (sad(s)) return 'chill'
    const cycle: ActionId[] = ['dsa', 'project', 'study', 'dsa', 'mock', 'resume', 'apply', 'network', 'dsa', 'chill']
    const used = Object.values(s.usedToday).reduce((a, b) => a + (b ?? 0), 0)
    return cycle[(s.day * 3 + used) % cycle.length]
  },
  'Sleep only': () => 'sleep',
  'Chaos': (s) => {
    const all: ActionId[] = ['dsa', 'sleep', 'study', 'project', 'mock', 'apply', 'resume', 'network', 'chill', 'college']
    return all[(s.rngState >>> 3) % all.length]
  },
}

function run(strategy: Strategy, seed: number) {
  let s = createGame(seed)
  let guard = 0
  while (s.status !== 'finished' && guard++ < 6000) {
    if (s.interview) {
      if (s.interview.outcome) { s = closeInterview(s); continue }
      s = answerInterview(s, (s.rngState >>> 4) % 3)
      continue
    }
    if (s.activeEvent) {
      const n = s.activeEvent.choices?.length ?? 0
      s = applyEvent(s, n ? (s.rngState >>> 2) % n : undefined).state
      continue
    }
    if (s.status === 'dayEnd') { s = startDay(s); continue }
    // apply to any eligible discovered company
    for (const a of s.applications) {
      if (a.stage === 'discovered' && !eligibilityGaps(COMPANY_MAP[a.companyId], s.stats).length) s = applyToCompany(s, a.companyId)
    }
    if (s.week.cleared && !s.week.celebrated) s = acknowledgeWeek(s)
    {
      let a = strategy(s)
      if (a === 'dsa') { const ks = ['arrays', 'graphs', 'dp', 'system'] as const; s = setFocus(s, [...ks].sort((x, y) => s.skills[x] - s.skills[y])[0]) }
      if (!canAct(s, a).ok) a = canAct(s, 'sleep').ok ? 'sleep' : canAct(s, 'chill').ok ? 'chill' : a
      const r = canAct(s, a).ok ? performAction(s, a) : { ok: false, state: s }
      if (r.ok) { s = unlockAchievements(r.state).state; continue }
      s = endDay(s)
    }
  }
  if (s.status !== 'finished') throw new Error('did not finish')
  return s
}

const seeds = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919)
console.log('strategy'.padEnd(18), 'avg'.padStart(5), 'min'.padStart(4), 'max'.padStart(4), ' offers  lpa   dsa  cgpa  proj  intv  well  ach')
for (const [name, strat] of Object.entries(strategies)) {
  const rs = seeds.map((seed) => run(strat, seed))
  const avg = (k: (r: GameState) => number) => (rs.reduce((a, r) => a + k(r), 0) / rs.length).toFixed(1)
  const scores = rs.map((r) => r.result!.score)
  console.log(
    name.padEnd(18), avg((r) => r.result!.score).padStart(5), String(Math.min(...scores)).padStart(4), String(Math.max(...scores)).padStart(4),
    ' ', avg((r) => r.metrics.offers).padStart(5), avg((r) => r.result!.salaryLpa).padStart(5),
    avg((r) => r.stats.dsa).padStart(5), avg((r) => toCgpa(r.stats.cgpa)).padStart(5), avg((r) => r.stats.projects).padStart(5),
    avg((r) => r.stats.interview).padStart(5), avg((r) => r.stats.wellbeing).padStart(5), avg((r) => r.achievements.length).padStart(4),
  )
}
