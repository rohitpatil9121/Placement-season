import type { Rival } from '../types/game'
import { Rng } from '../utils/random'

type RivalDef = Omit<Rival, 'placedDay' | 'placed' | 'referred'> & { window: [number, number] }

const DEFS: RivalDef[] = [
  { id: 'priya', name: 'Priya', line: 'The topper. Colour-coded notes. Sleeps eight hours. Unfair.', companyId: 'microsoft', window: [55, 72], canRefer: false },
  { id: 'arjun', name: 'Arjun', line: 'Grinds LeetCode at 2 AM. Has opinions about graphs.', companyId: 'amazon', window: [50, 66], canRefer: true },
  { id: 'rahul', name: 'Rahul', line: 'Chill. Never seen him study. Somehow fine.', companyId: 'tcs', window: [26, 44], canRefer: false },
]

export function makeRivals(rng: Rng): Rival[] {
  return DEFS.map(({ window, ...d }) => ({ ...d, placedDay: rng.int(window[0], window[1]), placed: false, referred: false }))
}

export const RIVAL_PLACED_LINES: Record<string, string[]> = {
  priya: ['Priya got placed. She thanked her parents, her professors and, somehow, you.', 'Priya is placed. The group chat has 400 messages. None of them are about you.'],
  arjun: ['Arjun cracked it. He says the graph question was "easy". It was not easy.', 'Arjun is placed. He immediately asked if you want a referral. Bless him.'],
  rahul: ['Rahul got placed. Rahul has never opened LeetCode. You are happy for him. Obviously.', 'Rahul is placed. He found out from someone else. Classic Rahul.'],
}
