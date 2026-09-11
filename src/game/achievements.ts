import type { Achievement } from '../types/game'

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'night_owl', name: 'The Night Owl', description: 'Sleep below 20 for five days.', check: (s) => s.metrics.lowSleepDays >= 5 },
  { id: 'grinder', name: 'The Grinder', description: 'DSA above 90.', check: (s) => s.stats.dsa > 90 },
  { id: 'academic_weapon', name: 'The Academic Weapon', description: 'CGPA above 9.', check: (s) => s.stats.cgpa > 80 },
  { id: 'referral_merchant', name: 'Referral Merchant', description: 'Receive three referrals.', check: (s) => s.metrics.referrals >= 3 },
  { id: 'last_minute', name: 'Last-Minute Legend', description: 'Get placed on Day 90.', check: (s) => s.status === 'finished' && !!s.result?.placed && !s.result.viaOffer },
  { id: 'touch_grass', name: 'Touch Grass', description: 'Wellbeing above 90 for ten days.', check: (s) => s.metrics.highWellbeingDays >= 10 },
  { id: 'balanced', name: 'The Balanced One', description: 'All core stats above 50 for seven days.', check: (s) => s.metrics.balancedDays >= 7 },
  { id: 'builder', name: 'The Builder', description: 'Projects above 70.', check: (s) => s.stats.projects > 70 },
  { id: 'first_offer', name: 'First Offer', description: 'Receive an on-campus offer.', check: (s) => s.metrics.offers >= 1 },
  { id: 'early_bird', name: 'Early Bird', description: 'Hold an offer before Day 70.', check: (s) => s.metrics.firstOfferDay !== null && s.metrics.firstOfferDay < 70 },
  { id: 'caffeine', name: 'Caffeine Dependency', description: 'Thirty coffees in one season.', check: (s) => s.metrics.coffees >= 30 },
  { id: 'spray_pray', name: 'Spray and Pray', description: 'Fifty off-campus applications.', check: (s) => s.metrics.applicationsSent >= 50 },
  { id: 'survivor', name: 'Halfway', description: 'Reach Day 45.', check: (s) => s.day >= 45 },
  { id: 'final_week', name: 'Final Week', description: 'Reach Day 81.', check: (s) => s.day >= 81 },
  { id: 'emotionally_accurate', name: 'Emotionally Accurate', description: 'Five breakdowns in one season.', check: (s) => s.metrics.breakdowns >= 5 },
  { id: 'running_on_empty', name: 'Running on Empty', description: 'Hit zero energy.', check: (s) => s.metrics.zeroEnergyHits >= 1 },
  { id: 'linkedin_survivor', name: 'LinkedIn Survivor', description: 'Survive five LinkedIn moments.', check: (s) => s.metrics.linkedinEvents >= 5 },
  { id: 'rejected_thrice', name: 'Thick Skin', description: 'Three rejections, still going.', check: (s) => s.metrics.rejections >= 3 },
  { id: 'campus_legend', name: 'Campus Legend', description: 'Finish with a score of 90 or more.', check: (s) => s.status === 'finished' && (s.result?.score ?? 0) >= 90 },
  { id: 'dream', name: 'Dream Offer', description: 'Get an offer from a tier-three company.', check: (s) => s.applications.some((a) => a.stage === 'offer' && ['nexora', 'lumen', 'quanta'].includes(a.companyId)) },
]

export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
