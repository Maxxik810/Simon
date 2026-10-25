import { useEffect, useRef, useState } from 'react';
import NavBar, { type Screen } from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import { useGame } from './game/useGame';
import { useHistory } from './history/useHistory';
import { createResult } from './history/historyStorage';

// App owns the current screen, the game and the history, so switching screens
// does not unmount the game state (ADR-2). Switching is a state change only:
// no router and no page reload.
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const game = useGame();
  const history = useHistory();

  const { status, completedRounds, gameId } = game.state;
  const { save, resetSaveError } = history;
  // gameId of the last saved game: guards against double saves (ADR-4)
  const savedGameIdRef = useRef(0);

  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return;
    if (savedGameIdRef.current === gameId) return;
    savedGameIdRef.current = gameId;
    save(createResult(status, completedRounds));
  }, [status, completedRounds, gameId, save]);

  useEffect(() => {
    if (status === 'presenting' && gameId !== 0) resetSaveError();
  }, [gameId, status, resetSaveError]);

  function navigate(next: Screen) {
    // Leaving mid-game pauses it; only "המשך משחק" resumes (ADR-3)
    if (next === 'about') game.pauseGame();
    setScreen(next);
  }

  return (
    <div className="app">
      <main className="app__content">
        {screen === 'home' ? (
          <HomeScreen game={game} saveError={history.saveError} />
        ) : (
          <AboutScreen history={history} />
        )}
      </main>
      <NavBar current={screen} onNavigate={navigate} />
    </div>
  );
}
