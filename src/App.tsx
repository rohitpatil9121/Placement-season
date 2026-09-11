import { useEffect, useState } from 'react'
import { AchievementToast } from './components/AchievementToast'
import { AchievementsModal } from './components/AchievementsModal'
import { Confetti } from './components/Confetti'
import { EventModal } from './components/EventModal'
import { FloatingNumbers } from './components/FloatingNumbers'
import { GameHeader } from './components/GameHeader'
import { GameOverScreen } from './components/GameOverScreen'
import { GameScreen } from './components/GameScreen'
import { Leaderboard } from './components/Leaderboard'
import { SettingsModal } from './components/SettingsModal'
import { StartScreen } from './components/StartScreen'
import { Tutorial } from './components/Tutorial'
import { getPhase } from './data/phases'
import { useGameState } from './hooks/useGameState'
import { useSound } from './hooks/useSound'

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const play = useSound(soundEnabled)
  const game = useGameState(play)
  const { state, settings, view } = game
  const [modal, setModal] = useState<'none' | 'settings' | 'achievements' | 'leaderboard'>('none')

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound])

  // phase-based theme glow
  useEffect(() => {
    const glow = state && view === 'game' ? getPhase(state.day).glow : '124, 92, 252'
    document.documentElement.style.setProperty('--phase-glow', glow)
  }, [state, view])

  const close = () => setModal('none')
  const inGame = view === 'game' && !!state && state.status === 'playing'

  return (
    <div className="min-h-dvh">
      {view === 'start' && (
        <StartScreen
          hasSave={game.hasSave}
          saved={state}
          onStart={game.startNewGame}
          onContinue={game.continueGame}
          onHowToPlay={game.openTutorial}
          onAchievements={() => setModal('achievements')}
          onLeaderboard={() => setModal('leaderboard')}
        />
      )}

      {view === 'tutorial' && <Tutorial onDone={game.finishTutorial} />}

      {view === 'game' && state && (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
          <GameHeader
            day={state.day}
            sound={settings.sound}
            onToggleSound={() => game.updateSettings({ sound: !settings.sound })}
            onSettings={() => setModal('settings')}
            onAchievements={() => setModal('achievements')}
            onHome={game.goToStart}
            savedTick={game.savedTick}
          />
          <GameScreen
            state={state}
            lastDeltas={game.lastDeltas}
            shakeTick={game.fx.shake}
            reduced={settings.reducedMotion}
            onAction={game.doAction}
            onEndDay={game.endDay}
          />
          <EventModal state={state} onResolve={game.resolveEvent} />
        </div>
      )}

      {view === 'result' && state && state.finalResult && (
        <GameOverScreen
          state={state}
          reduced={settings.reducedMotion}
          onPlayAgain={game.startNewGame}
          onAchievements={() => setModal('achievements')}
          onHome={game.goToStart}
          onToast={game.pushToast}
        />
      )}

      <FloatingNumbers items={game.floats} />
      <AchievementToast toasts={game.toasts} onDismiss={game.dismissToast} />
      <Confetti trigger={game.fx.confetti} reduced={settings.reducedMotion} />

      <SettingsModal
        open={modal === 'settings'}
        onClose={close}
        settings={settings}
        onChange={game.updateSettings}
        onResetGame={game.resetGame}
        onResetEverything={game.resetEverything}
        onContinue={inGame ? close : undefined}
        inGame={inGame}
      />
      <AchievementsModal open={modal === 'achievements'} onClose={close} unlocked={Array.from(new Set([...game.globalAchievements, ...(state?.achievements ?? [])]))} />
      <Leaderboard open={modal === 'leaderboard'} onClose={close} entries={game.leaderboard} />
    </div>
  )
}
