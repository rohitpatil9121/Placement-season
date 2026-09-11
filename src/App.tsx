import { MotionConfig } from 'framer-motion'
import { useEffect, useState } from 'react'
import { DayTransition } from './components/DayTransition'
import { EventSheet } from './components/EventSheet'
import { GameScreen } from './components/GameScreen'
import { InterviewSheet } from './components/InterviewSheet'
import { Notices } from './components/Notices'
import { PlacementDay } from './components/PlacementDay'
import { SettingsSheet } from './components/SettingsSheet'
import { CalendarSheet } from './components/CalendarSheet'
import { StartScreen } from './components/StartScreen'
import { useGame } from './hooks/useGame'
import { useSound } from './hooks/useSound'
import { useMusic } from './hooks/useMusic'
import { getPhase } from './game/balance'
import { loadLiveCompanies, type LiveInfo } from './game/liveData'

export default function App() {
  const [soundOn, setSoundOn] = useState(true)
  const play = useSound(soundOn)
  const g = useGame(play)
  const { state, settings, view } = g
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'settings' | 'achievements'>('settings')
  const openTrophies = () => { setSettingsTab('achievements'); setSettingsOpen(true); g.markAchievementsSeen() }
  const openSettings = () => { setSettingsTab('settings'); setSettingsOpen(true) }

  useEffect(() => setSoundOn(settings.sound), [settings.sound])
  useMusic(settings.music, state && view === 'game' ? getPhase(state.day).id : view === 'result' ? 'day90' : 'prep')
  const [live, setLive] = useState<LiveInfo>({ updatedAt: null, source: 'bundled' })
  useEffect(() => { void loadLiveCompanies().then(setLive) }, [])

  // first-day hint is shown once, then remembered
  useEffect(() => {
    if (view === 'game' && state && state.day >= 2 && !settings.seenFirstDayHint) g.setSettings({ seenFirstDayHint: true })
  }, [view, state, settings.seenFirstDayHint, g])

  const inRun = !!state && state.status !== 'finished'

  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>
      {view === 'start' && (
        <StartScreen saved={state} best={g.best} corrupted={g.corrupted} onStart={g.startNew} onContinue={g.continueGame} onSettings={openSettings} />
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
            nonce={g.nonce}
            unseen={g.unseenAchievements}
            sound={settings.sound || settings.music}
            onToggleSound={() => { const on = !(settings.sound || settings.music); g.setSettings({ sound: on, music: on }) }}
            onTrophies={openTrophies}
            onCalendar={() => setCalendarOpen(true)}
            onAct={g.act}
            onEndDay={g.finishDay}
            onApply={g.apply}
            onIgnore={g.ignore}
            onSettings={openSettings}
            onHome={g.home}
            live={live}
          />
          <EventSheet state={state} onResolve={g.resolveEvent} />
          <InterviewSheet state={state} onAnswer={g.answer} onClose={g.endInterview} />
        </>
      )}

      {view === 'result' && state && state.result && (
        <PlacementDay state={state} reduced={settings.reducedMotion} onPlayAgain={g.startNew} onHome={g.home} onNotify={g.notify} onBeat={(i) => play(i >= 4 ? 'chime' : 'pop')} />
      )}

      {state && <CalendarSheet open={calendarOpen} onClose={() => setCalendarOpen(false)} state={state} />}
      <Notices items={g.notices} onDismiss={g.dismiss} />
      <SettingsSheet
        open={settingsOpen}
        tab={settingsTab}
        onTab={setSettingsTab}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={g.setSettings}
        best={g.best}
        unlocked={Array.from(new Set([...g.globalAchievements, ...(state?.achievements ?? [])]))}
        inRun={inRun}
        onNewGame={g.startNew}
        onResetAll={g.resetAll}
      />
    </MotionConfig>
  )
}
