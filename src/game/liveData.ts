import type { Company } from '../types/game'
import { COMPANIES, COMPANY_MAP } from './companies'

/**
 * Company data can be updated without rebuilding the game. On load we try, in order:
 *   1. the JSON in the GitHub repo (works on any deployed copy, updates as soon as the file is edited)
 *   2. the JSON bundled next to the page
 * and fall back to the compiled list. Bad data is ignored, never crashes the game.
 */
export const REMOTE_URL = 'https://raw.githubusercontent.com/rohitpatil9121/Placement-season/main/public/data/companies.json'
export const LOCAL_URL = './data/companies.json'

export type LiveInfo = { updatedAt: string | null; source: 'remote' | 'local' | 'bundled' }

const TESTS = new Set(['dsa', 'projects', 'aptitude'])
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function validCompany(c: unknown): c is Company {
  if (!c || typeof c !== 'object') return false
  const x = c as Partial<Company>
  return (
    typeof x.id === 'string' && /^[a-z0-9_-]{1,32}$/.test(x.id) &&
    typeof x.name === 'string' && x.name.length > 0 && x.name.length < 40 &&
    typeof x.role === 'string' && typeof x.tagline === 'string' &&
    num(x.packageLpa) && x.packageLpa >= 0 && x.packageLpa < 200 &&
    !!x.eligibility && typeof x.eligibility === 'object' &&
    typeof x.test === 'string' && TESTS.has(x.test) &&
    num(x.appearsFrom) && num(x.appearsTo) && x.appearsFrom >= 1 && x.appearsTo <= 90 && x.appearsFrom <= x.appearsTo &&
    (x.tier === 1 || x.tier === 2 || x.tier === 3) &&
    (x.asks === undefined || (Array.isArray(x.asks) && x.asks.every((a) => ['arrays', 'graphs', 'dp', 'system'].includes(a as string))))
  )
}

function applyList(list: Company[]) {
  COMPANIES.splice(0, COMPANIES.length, ...list)
  for (const k of Object.keys(COMPANY_MAP)) delete COMPANY_MAP[k]
  for (const c of list) COMPANY_MAP[c.id] = c
}

async function tryFetch(url: string): Promise<{ companies: Company[]; updatedAt: string | null } | null> {
  try {
    const ctrl = new AbortController()
    const t = window.setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
    window.clearTimeout(t)
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object') return null
    const raw = (data as { companies?: unknown; updatedAt?: unknown }).companies
    if (!Array.isArray(raw)) return null
    const companies = raw.filter(validCompany)
    if (companies.length < 3) return null
    const updatedAt = typeof (data as { updatedAt?: unknown }).updatedAt === 'string' ? ((data as { updatedAt: string }).updatedAt) : null
    return { companies, updatedAt }
  } catch {
    return null
  }
}

export async function loadLiveCompanies(): Promise<LiveInfo> {
  const remote = await tryFetch(REMOTE_URL)
  if (remote) {
    applyList(remote.companies)
    return { updatedAt: remote.updatedAt, source: 'remote' }
  }
  const local = await tryFetch(LOCAL_URL)
  if (local) {
    applyList(local.companies)
    return { updatedAt: local.updatedAt, source: 'local' }
  }
  return { updatedAt: null, source: 'bundled' }
}
