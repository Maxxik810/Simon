import ScreenHeader from '../components/ScreenHeader';
import SimonBoard from '../components/SimonBoard';
import './HomeScreen.css';

// Milestone 1: the "before game" state only. The start button has no action yet.
export default function HomeScreen() {
  return (
    <div className="home">
      <ScreenHeader title="סיימון" />
      <p className="home__stage">שלב 1 מתוך 10</p>
      {/* Reserved for status text ("the game is showing the sequence", "your turn") */}
      <p className="home__status" aria-live="polite" />
      <SimonBoard />
      <div className="home__actions">
        <button type="button" className="btn-primary">
          התחל משחק
        </button>
      </div>
    </div>
  );
}
