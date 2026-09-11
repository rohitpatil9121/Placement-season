# 🎓 Placement Season

> 90 days. 3 actions a day. One placement. **Can you survive final year?**

Placement Season is a humorous, fully playable browser game about the final-year placement grind at an Indian college. It blends a student-life simulator, a resource-management game, and a meme generator. You have 90 days before placement day to balance six stats, survive random events (surprise vivas, LinkedIn, Sharma ji ka beta), and land the best offer you can.

Results may be emotionally accurate.

---

## ✨ Features

- **Full 90-day loop** — 3 action points per day, 13 distinct actions, end-of-day recovery, 5 story arcs with escalating intensity.
- **Six visible stats** (Energy, DSA, Sleep, CGPA, Wellbeing, Career) plus 8 hidden progress stats (Projects, Resume, Interview, Applications, Networking, Luck, Motivation, Attendance).
- **40+ random events** across five rarity tiers (Common → Legendary), including multi-choice dilemmas with real tradeoffs.
- **Diminishing returns & decay** — skills get harder to raise as they grow, and neglected skills fade. No single perfect strategy.
- **20 achievements** with unlock toasts, confetti and a persistent trophy cabinet.
- **Placement Day** — dramatic reveal, 7 distinct endings, salary in LPA, a fictional company name, radar chart, and a humorous season summary.
- **Share your result** via the Web Share API (clipboard fallback).
- **Local leaderboard** of your best runs.
- **Auto-save** to LocalStorage after every action, with validated loading and a safe reset if the save is corrupted.
- **Seeded RNG** so every run is reproducible from its seed.
- **Polished UI** — glassmorphism dashboard, animated stat bars, floating stat deltas, screen shake on bad events, legendary glow, phase-based theme shifts.
- **Responsive** — desktop dashboard layout; stacked cards, collapsible log and a bottom action bar on mobile.
- **Accessible** — keyboard shortcuts (`1`–`9` for actions, `E` to end day), visible focus rings, ARIA labels, focus-trapped dialogs, reduced-motion mode.
- **Optional sound** — tiny WebAudio synth blips, muted by a single click, never autoplayed.

## 🛠 Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React
- LocalStorage (no backend)

## 🚀 How to Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npx tsx scripts/sim.ts   # headless balance simulation across strategies
```

## 🎮 Game Mechanics

### Daily loop

```
Start day → see stats → spend 3 action points → events may interrupt
→ End day → overnight recovery (driven by Sleep) → next day → … → Day 90 → Placement Day
```

### Stats

| Stat | Range | Start | Notes |
|------|-------|-------|-------|
| ⚡ Energy | 0–100 | 80 | At 0, demanding actions are locked and bad events get likelier. |
| 🧠 DSA | 0–100 | 30 | Diminishing returns above 30/50/70/85. Fades slightly on days you skip practice. |
| 😴 Sleep | 0–100 | 65 | Drives overnight energy recovery and learning efficiency. Decays every night. |
| 📚 CGPA | 5.0–10.0 | 7.8 | Stored internally as 0–100 (`100 = 10.0`). Drifts down if academics are ignored. |
| ❤️ Wellbeing | 0–100 | 70 | Low wellbeing boosts breakdown & LinkedIn events and hurts productivity. |
| 💼 Career | 0–100 | computed | Hidden weighted blend of DSA, projects, resume, interview, networking, applications and CGPA. |

### Actions

| Action | Cost | Main effects |
|--------|------|--------------|
| 🧠 Grind DSA | 1 | DSA +4…8 (scaled by sleep, energy, mood), Energy −12, Wellbeing −3 |
| 😴 Deep Sleep | 1 | Sleep +20, Energy +15, Wellbeing +8 |
| 📚 Study Academics | 1 | CGPA +0.05…0.12, Energy −10, Wellbeing −3 |
| 💻 Build Project | 1 | Projects +5, Career +2, Energy −12 |
| 🎤 Mock Interview | 1 | Interview +5, Energy −10, Wellbeing −4; 25% chance of getting destroyed |
| 📨 Apply for Jobs | 1 | Applications +3 × resume quality, Energy −5 |
| 📄 Work on Resume | 1 | Resume +7, Career +2 |
| 🤝 Network | 1 | Networking +5, Luck +2; 10% chance of a referral |
| 🎮 Chill With Friends | 1 | Wellbeing +15, Energy +5, Sleep +5 |
| 🏫 Attend College | 1 | Attendance +4, CGPA +0.03; 20% chance of surprise viva |
| 📱 Scroll LinkedIn | 1 | Wellbeing −5; 35% chance of a painful post |
| ☕ Coffee | 0 (max 2/day) | Energy +12, Sleep −8 |
| 🛋️ Skip Everything | 3 | Big recovery, small DSA & motivation loss |

### Phases

| Days | Arc | Event intensity |
|------|-----|-----------------|
| 1–30 | 📚 Preparation Arc | Low |
| 31–60 | 🔥 Grind Arc | Medium — companies start appearing |
| 61–80 | 😰 Placement Arc | High — OAs, shortlists, interviews |
| 81–89 | 💀 Final Boss Arc | Very high |
| 90 | 🎓 Placement Day | Final result |

### Events

Every action has a chance to trigger an event, and each morning rolls another one. Rarity weights are Common 55%, Uncommon 25%, Rare 12%, Epic 6%, Legendary 2%, with rarer and placement-themed events boosted in later arcs. Events can have fixed effects, conditional effects (e.g. a company visit helps if DSA > 50 and hurts otherwise), or player choices. The same event never repeats within six rolls.

### Placement score

On Day 90 a hidden weighted formula over DSA, CGPA, Projects, Interview, Resume, Networking, Applications and Luck produces a 0–100 score, nudged by Wellbeing and any offers you collected during the season. The score maps to seven endings from *"Placement Season Defeated You"* (₹0 LPA) to *"Campus Legend"* (₹25+ LPA).

### Balance

`scripts/sim.ts` plays 40 seeded runs per strategy. A perfectly balanced bot scores ~89, a chaotic random player ~73, single-focus specialists ~55, and a sleep-only run ~33. Every strategy can finish; none is dominant.

## 📁 Project Structure

```
src/
  components/
    GameHeader.tsx        top bar: title, day counter, phase pill, sound/settings
    GameScreen.tsx        main dashboard layout + keyboard shortcuts + mobile bar
    StatCard.tsx          animated stat card with status line and delta badge
    StatBar.tsx           animated progress bar
    DayProgress.tsx       "Placement Day" countdown bar
    ActionCard.tsx        action button with effect chips and cost dots
    EventModal.tsx        pause-the-game event dialog (fixed or choice-based)
    ActivityLog.tsx       timestamped log (collapsible on mobile)
    FloatingNumbers.tsx   floating "+6 🧠 / −12 ⚡" feedback
    AchievementToast.tsx  toast stack for achievements / info / errors
    Confetti.tsx          lightweight CSS confetti
    StartScreen.tsx       landing screen with continue / new game confirmation
    Tutorial.tsx          6-step skippable tutorial
    GameOverScreen.tsx    dramatic "Placement Day" reveal
    PlacementResult.tsx   final result, radar chart, season summary, share
    RadarChart.tsx        SVG radar chart
    Leaderboard.tsx       local top-10 runs
    AchievementsModal.tsx trophy cabinet
    SettingsModal.tsx     sound / music / reduced motion / reset
    Modal.tsx             accessible dialog shell (focus trap, Esc, backdrop)
  data/
    actions.ts            action definitions + flavor lines
    events.ts             event pool + rarity weights
    achievements.ts       achievement definitions + checks
    phases.ts             arcs, event intensity, constants
  hooks/
    useGameState.ts       React glue: state, persistence, toasts, fx, leaderboard
    useSound.ts           WebAudio synth
  types/
    game.ts               all shared types
  utils/
    gameLogic.ts          pure, deterministic game engine
    scoring.ts            CGPA conversion, career score, placement outcomes
    random.ts             seeded PRNG (mulberry32)
    storage.ts            validated LocalStorage save/load
    share.ts              share-text builder + Web Share / clipboard
  App.tsx                 view router + modals
scripts/
  sim.ts                  headless balance simulation
```

Game logic lives entirely in `src/utils` and `src/data`; it is pure, seeded and has no React dependency, so it can be simulated headlessly (see `scripts/sim.ts`).

## 📝 License

MIT. Fictional companies, fictional salaries, real feelings.
