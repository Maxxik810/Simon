import { useState } from 'react';
import NavBar, { type Screen } from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';

// App owns the current screen. Switching screens is a state change only:
// no router and no page reload. Later milestones keep the game state here
// so that moving to "About" does not unmount it (ADR-2).
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div className="app">
      <main className="app__content">
        {screen === 'home' ? <HomeScreen /> : <AboutScreen />}
      </main>
      <NavBar current={screen} onNavigate={setScreen} />
    </div>
  );
}
