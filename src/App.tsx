import { useState } from 'react';
import NavBar, { type Screen } from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import { useGame } from './game/useGame';

// App owns the current screen and the game, so switching screens does not
// unmount the game state (ADR-2). Switching is a state change only: no router
// and no page reload.
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const game = useGame();

  function navigate(next: Screen) {
    // Leaving mid-game pauses it; only "המשך משחק" resumes (ADR-3)
    if (next === 'about') game.pauseGame();
    setScreen(next);
  }

  return (
    <div className="app">
      <main className="app__content">
        {screen === 'home' ? <HomeScreen game={game} /> : <AboutScreen />}
      </main>
      <NavBar current={screen} onNavigate={navigate} />
    </div>
  );
}
