import { useEffect, useState } from 'react'
import { DayTransition } from './components/DayTransition'
import { EventSheet } from './components/EventSheet'
import { GameScreen } from './components/GameScreen'
import { InterviewSheet } from './components/InterviewSheet'
import { Notices } from './components/Notices'
import { PlacementDay } from './components/PlacementDay'
import { SettingsSheet } from './components/SettingsSheet'
import { StartScreen } from './components/StartScreen'
import { useGame } from './hooks/useGame'
import { useSound } from './hooks/useSound'

export default function App() {
  const [soundOn, setSoundOn] = useState(false)
  const play = useSound(soundOn)
  const g = useGame(play)
  const { state, settings, view } = g
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => setSoundOn(settings.sound), [settings.sound])

  // first-day hint is shown once, then remembered
  useEffect(() => {
    if (view === 'game' && state && state.day >= 2 && !settings.seenFirstDayHint) g.setSettings({ seenFirstDayHint: true })
  }, [view, state, settings.seenFirstDayHint, g])

  const inRun = !!state && state.status !== 'finished'

  return (
    <>
      {view === 'start' && (
        <StartScreen saved={state} best={g.best} corrupted={g.corrupted} onStart={g.startNew} onContinue={g.continueGame} onSettings={() => setSettingsOpen(true)} />
      )}

      {view === 'game' && state && state.status === 'dayEnd' && state.daySummary && <DayTransition state={state} onStart={g.beginDay} />}

      {view === 'game' && state && state.status === 'playing' && (
        <>
          <GameScreen
            state={state}
            deltas={g.lastDeltas}
            line={g.lastLine}
            shake={g.shake}
            savedAt={g.savedAt}
            hint={state.day === 1 && !settings.seenFirstDayHint}
            onAct={g.act}
            onEndDay={g.finishDay}
            onApply={g.apply}
            onIgnore={g.ignore}
            onSettings={() => setSettingsOpen(true)}
            onHome={g.home}
          />
          <EventSheet state={state} onResolve={g.resolveEvent} />
          <InterviewSheet state={state} onAnswer={g.answer} onClose={g.endInterview} />
        </>
      )}

      {view === 'result' && state && state.result && (
        <PlacementDay state={state} reduced={settings.reducedMotion} onPlayAgain={g.startNew} onHome={g.home} onNotify={g.notify} />
      )}

      <Notices items={g.notices} onDismiss={g.dismiss} />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={g.setSettings}
        best={g.best}
        unlocked={Array.from(new Set([...g.globalAchievements, ...(state?.achievements ?? [])]))}
        inRun={inRun}
        onNewGame={g.startNew}
        onResetAll={g.resetAll}
      />
    </>
  )
}
