# Placement Season

A small, premium browser game about the last 90 days before campus placements at an Indian college. One decision at a time. How badly can this go?

Ninety days, three actions a day, six things to balance, a company pipeline with real eligibility gates, short interactive interviews, and a placement-day reveal you will want to screenshot.

## Features

- **A real 90-day loop.** Three actions a day, an end-of-day transition that shows exactly what changed, and a morning that may bring an event, a company, or an interview.
- **Five core stats, progressively revealed career stats.** Energy, Sleep, DSA, CGPA and Wellbeing from Day 1. Projects, Resume, Interview, Networking and Applications appear only once you start working on them.
- **Honest consequences.** Every action shows its effect before you commit. Diminishing returns make each skill harder to push the higher it gets, and neglected skills fade.
- **Forty-plus events** with dry, observational writing. Some are interruptions, some are decisions with real tradeoffs. Rarity changes how an event feels, not a label on the screen.
- **Companies with personalities.** Eight fictional employers with eligibility thresholds (CGPA, DSA, Projects, Resume), a discovered → applied → assessment → shortlisted → interview → result pipeline, and a short three-question interview that actually matters.
- **A controlled random engine.** Strong networking raises referral odds, low wellbeing invites worse days, and an anti-frustration rule keeps a good run from being wrecked by luck while tossing struggling players an opportunity.
- **Placement Day.** A nearly empty screen, a staged reveal of your numbers, then the verdict and a poster-style result card built for an Instagram story screenshot.
- **Share.** Web Share on mobile, clipboard everywhere else. "Copied. Go humblebrag."
- **Twenty achievements**, local best-run records, auto-save after every change, a corrupted-save recovery path, keyboard shortcuts, reduced motion, and an optional muted-by-default sound layer.

## Gameplay

1. Start. You are on Day 1 with a 7.8 CGPA and unearned confidence.
2. Each day, spend three actions: practice DSA, study, build a project, sleep, mock interview, fix your resume, network, go out, attend class, apply off-campus. Coffee is free but borrows from tonight. Writing off a day costs all three.
3. Events interrupt. Some just happen; some ask what you do.
4. From Day 20, companies start visiting campus. Apply if you clear the bar. Clear the assessment, sit the interview, get the offer or don't.
5. End the day. See what changed. Start the next one.
6. On Day 90, the season is scored and the verdict is revealed.

Keyboard: `1`–`9` triggers the actions in order, `E` ends the day, `Enter` starts the next day, `Esc` closes sheets.

## Game mechanics

| Stat | Behaviour |
|------|-----------|
| Energy | Spent by work, restored overnight in proportion to Sleep. At zero, demanding actions lock. |
| Sleep | Decays every night. Restored by sleeping, drained by coffee, parties and all-nighters. |
| DSA | Improves slowly with practice. Gains shrink above 30/50/70/85. Fades a little on days you skip. |
| CGPA | Shown as 5.0–10.0, stored 0–100. Moves slowly. Drifts down if academics are ignored for long. |
| Wellbeing | Moves fast. Below 30, worse events and weaker productivity. Above 85, small bonuses. |
| Career stats | Projects, Resume, Interview, Networking, Applications, plus hidden Luck and Motivation. |

**Companies.** Each has a role, package, tagline, eligibility, and an assessment type (DSA, projects or aptitude). Assessment pass chance is driven by the matching stats and luck; interview success is the sum of your three answers plus Interview skill, judged against the company's tier.

**Scoring.** A hidden weighted blend of DSA, CGPA, Projects, Interview, Resume, Networking, Applications and Luck, nudged by Wellbeing and any offers held. An on-campus offer guarantees placement at that package; otherwise the score maps to one of seven outcomes from "Not placed" to "Campus legend" with a fictional off-campus employer.

**Balance.** `npx tsx scripts/sim.ts` plays 40 seeded runs per strategy. A perfectly balanced bot scores about 88, chaotic random play about 77, single-focus specialists in the low 50s, and sleeping all season about 34. Every style finishes; none dominates.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Lucide React · LocalStorage. No backend, no analytics, nothing fake.

## Architecture

```
src/
  game/            pure, data-driven engine (no React)
    actions.ts     action definitions, previews, microcopy
    events.ts      event pool, conditions, choices
    companies.ts   companies, eligibility, interview questions
    achievements.ts
    balance.ts     constants, phases, tiers, overnight recovery, pass chances
    scoring.ts     career score, placement score, outcomes, salary
    engine.ts      createGame · performAction · applyEvent · applyToCompany ·
                   answerInterview · endDay · startDay · unlockAchievements
  hooks/
    useGame.ts     React glue: state, persistence, notices, best runs
    useSound.ts    WebAudio synth (no assets)
  components/      screens and sheets; no game maths inside JSX
  utils/           seeded RNG, validated storage, share
  types/game.ts    all shared types
scripts/sim.ts     headless balance simulation
```

Every state transition is a pure function on `GameState`. Randomness comes from a seeded PRNG whose state is saved, so a run is reproducible from its seed.

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Design philosophy

- **Less UI, more meaning.** No card around everything, no rainbow bars, no gradients for their own sake. A warm off-white page, one serif for moments that matter, one sans for everything else, a single lime accent used as a signature.
- **The game feels physical.** Rows move a few pixels on hover, presses compress, numbers interpolate, days transition with a pause. Motion explains cause and effect.
- **Humor lives in the content.** The interface stays quiet so the writing can be funny. Emoji stay out of the chrome.
- **The important things are obvious.** What day is it, how long is left, how am I doing, what can I do, what will it cost. Everything else is secondary or hidden until it is relevant.
- **Nobody fights the interface.** One start button, a one-line first-day hint instead of a tutorial, consequence previews on every choice, no confirmation dialogs except for deleting progress.

## Future improvements

- A short second interview format (system design or HR) for tier-three companies.
- Per-run seed sharing so friends can play the same season.
- A compact run history alongside best runs.
- Optional dark theme.
