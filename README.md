# Placement Season

**Play it now: https://rohitpatil9121.github.io/Placement-season/**

A small, premium browser game about the last 90 days before campus placements at an Indian college. One decision at a time. How badly can this go?

Ninety days, three actions a day, six things to balance, a company pipeline with real eligibility gates, short interactive interviews, and a placement-day reveal you will want to screenshot.

## Features

- **A real 90-day loop.** Three actions a day, an end-of-day transition that shows exactly what changed, and a morning that may bring an event, a company, or an interview.
- **Five core stats, progressively revealed career stats.** Energy, Sleep, DSA, CGPA and Wellbeing from Day 1. Projects, Resume, Interview, Networking and Applications appear only once you start working on them.
- **Honest consequences.** Every action shows its effect before you commit. Diminishing returns make each skill harder to push the higher it gets, and neglected skills fade.
- **Forty-plus events** with dry, observational writing. Some are interruptions, some are decisions with real tradeoffs. Rarity changes how an event feels, not a label on the screen.
- **Real campus recruiters.** Twelve real employers, from TCS and Infosys to Amazon, Microsoft and Google, with approximate publicly reported fresher packages and typical eligibility thresholds (CGPA, DSA, Projects), a discovered → applied → assessment → shortlisted → interview → result pipeline, and a short three-question interview that actually matters.
- **A controlled random engine.** Strong networking raises referral odds, low wellbeing invites worse days, and an anti-frustration rule keeps a good run from being wrecked by luck while tossing struggling players an opportunity.
- **Placement Day.** A nearly empty screen, a staged reveal of your numbers, then the verdict and a poster-style result card built for an Instagram story screenshot.
- **A calendar.** A 90-day grid tinted by season; every past day shows coloured dots for what you ticked, and opening a day lists the actions, what happened, and how your stats moved by night.
- **Share.** Web Share on mobile, clipboard everywhere else. "Copied. Go humblebrag."
- **Twenty achievements**, local best-run records, auto-save after every change, a corrupted-save recovery path, keyboard shortcuts, reduced motion, and an optional muted-by-default sound layer.

## Gameplay

1. Start. You are on Day 1 with a 7.8 CGPA and unearned confidence.
2. Each day, spend three actions: practice DSA, study, build a project, sleep, mock interview, fix your resume, network, go out, attend class, apply off-campus. Coffee is free but borrows from tonight. Writing off a day costs all three.
3. Events interrupt. Some just happen; some ask what you do.
4. From Day 20, companies start visiting campus. Apply if you clear the bar. Clear the assessment, sit the interview, get the offer or don't.
5. End the day. See what changed. Start the next one.
6. Open the calendar (icon in the header) any time to look back at what you did on each day.
7. On Day 90, the season is scored and the verdict is revealed.

Keyboard: `1`–`9` triggers the actions in order, `E` ends the day, `Enter` starts the next day, `Esc` closes sheets.

## Game mechanics

| Stat | Behaviour |
|------|-----------|
| Sleep | Decays every night. Restored by sleeping, drained by coffee, parties and all-nighters. |
| DSA | Improves slowly with practice. Gains shrink above 30/50/70/85. Fades a little on days you skip. |
| CGPA | Shown as 5.0–10.0, stored 0–100. Moves slowly. Drifts down if academics are ignored for long. |
| Wellbeing | Moves fast. Below 30, worse events and weaker productivity. Above 85, small bonuses. |
| Career stats | Projects, Resume, Interview, Networking, Applications, plus hidden Luck and Motivation. |

**Companies.** Each has a role, package, tagline, eligibility, and an assessment type (DSA, projects or aptitude). Assessment pass chance is driven by the matching stats and luck; interview success is the sum of your three answers plus Interview skill, judged against the company's tier.

**Scoring.** A hidden weighted blend of DSA, CGPA, Projects, Interview, Resume, Networking, Applications and Luck, nudged by Wellbeing and any offers held. An on-campus offer guarantees placement at that package; otherwise the score maps to one of seven outcomes from "Not placed" to "Campus legend" with a fictional off-campus employer name.

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

## Calendar

The calendar icon in the header opens a 90-day grid laid out Monday to Sunday and tinted by season, with today outlined. Every finished day shows a coloured dot per action you ticked, and days with an on-campus offer carry a gold tag. Open a day to see the actions with their icons, what happened (events and company news), how each stat moved overnight, and the CGPA you ended on. Today shows what you have ticked so far. The engine stores one compact record per finished day (`history` in the save), so the calendar survives reloads and covers the whole season.

## Live data

On-campus companies load at runtime from [`public/data/companies.json`](public/data/companies.json) in this repo, fetched straight from GitHub with the bundled copy as a fallback. Edit that file and commit; every player sees the change on their next load, no rebuild needed. The Companies panel shows the `updatedAt` date and whether it came live from GitHub.

Every push to `main` also rebuilds and redeploys the game to GitHub Pages through [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

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

## Look and feel

- **A colour per stat.** Energy amber, Sleep indigo, DSA violet, CGPA green, Wellbeing coral, career stats teal, offers gold. The same hue follows a stat through its bar, its effect chip, its floating delta, the day summary and the result poster.
- **The world changes with the season.** The page tint shifts from mint (Preparation) to amber (Grind), blue (Interviews), coral (Final Week) and gold (Placement Day). Optional dark mode keeps the hues on deep navy.
- **A mascot.** A simple SVG student in the day hero (and beside the mobile state strip) whose face tracks energy and wellbeing: fresh, tired, dead-inside, hyped, celebrating. A second character, the interviewer, reacts to each answer.
- **Juice.** Coloured pills pop out of every action, bars spring and flash, negative changes give a two-pixel shake, action dots are gold coins that flip when spent, streaks earn a flame chip and a tiny bonus, good days end in confetti sized to how good they were, legendary events flash and sparkle, offers rain gold, achievements arrive as a shimmering medal and pulse the trophy button until opened.
- **Interactive surfaces.** Hovering an action ghost-fills the state bars with its exact effect. The timeline is a journey path with milestone icons and the mascot's head as the marker. Companies are trading cards with initials marks and tier colour bands that flip on stage change.
- **Placement Day.** Each revealed number lands with a coloured burst and a rising tone, the verdict fills the screen in the outcome colour with the mascot, and the 9:16 poster card carries stat bars in stat colours.
- **Sound and music, on by default.** Coin ticks for actions, a three-note sting for offers, a low thud for rejections, a short arpeggio for phase changes, a proper motif for placement, and a synthesized lo-fi loop (pads, bass, plucks, soft hats) whose key, tempo and brightness change with the season. Everything is WebAudio, no files. Both start on the first click, and the header mute silences both.

Everything above respects reduced motion: no particles, no shakes, no flashes, and instant sheet transitions.

## Design philosophy

- **Less UI, more meaning.** Colour carries information, never decoration: every hue on screen belongs to a stat, a phase, a tier or an outcome. A warm off-white page, one serif for moments that matter, one sans for everything else.
- **The game feels physical.** Rows move a few pixels on hover, presses compress, numbers interpolate, days transition with a pause. Motion explains cause and effect.
- **Humor lives in the content.** The interface stays quiet so the writing can be funny. Emoji stay out of the chrome.
- **The important things are obvious.** What day is it, how long is left, how am I doing, what can I do, what will it cost. Everything else is secondary or hidden until it is relevant.
- **Nobody fights the interface.** One start button, a one-line first-day hint instead of a tutorial, consequence previews on every choice, no confirmation dialogs except for deleting progress.

## Future improvements

- A short second interview format (system design or HR) for tier-three companies.
- Per-run seed sharing so friends can play the same season.
- A compact run history alongside best runs.
- Optional dark theme.
