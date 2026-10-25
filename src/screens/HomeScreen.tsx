import ScreenHeader from '../components/ScreenHeader';
import SimonBoard from '../components/SimonBoard';
import ResultOverlay from '../components/ResultOverlay';
import type { GameController } from '../game/useGame';
import { MAX_ROUNDS } from '../game/timing';
import './HomeScreen.css';

type HomeScreenProps = {
  game: GameController;
  saveError: boolean;
};

export default function HomeScreen({ game, saveError }: HomeScreenProps) {
  const { state, roundComplete, litColor, resultVisible, audioError } = game;
  const { status } = state;
  const ended = status === 'won' || status === 'lost';

  let statusText = '';
  let hintText = '';
  if (status === 'presenting') {
    statusText = 'המשחק מציג את הרצף';
    hintText = 'המתן…';
  } else if (status === 'awaitingInput') {
    statusText = 'התור שלך';
    if (!roundComplete) hintText = 'הקש על הצבעים לפי הסדר';
  } else if (status === 'paused') {
    statusText = 'המשחק מושהה';
  }

  return (
    <div className="home">
      <ScreenHeader title="סיימון" />
      <p className="home__stage">
        {`שלב ${state.round} מתוך ${MAX_ROUNDS}`}
      </p>
      <p className="home__status" aria-live="polite">
        {statusText}
      </p>

      <div className="home__board">
        <SimonBoard
          litColor={litColor}
          interactive={status === 'awaitingInput' && !roundComplete}
          dimmed={status === 'presenting' || status === 'paused'}
          onPressStart={game.pressStart}
          onPressEnd={game.pressEnd}
        />
        {ended && resultVisible && (
          <ResultOverlay outcome={status} completedRounds={state.completedRounds} />
        )}
      </div>

      <div className="home__actions">
        {status === 'idle' && (
          <button type="button" className="btn-primary" onClick={() => void game.startGame()}>
            התחל משחק
          </button>
        )}
        {status === 'paused' && (
          <button type="button" className="btn-primary" onClick={() => void game.resumeGame()}>
            המשך משחק
          </button>
        )}
        {ended && resultVisible && (
          <button type="button" className="btn-primary" onClick={game.dismissResult}>
            אישור
          </button>
        )}
        {hintText && <p className="home__hint">{hintText}</p>}
      </div>

      {ended && saveError && (
        <p className="home__error" role="alert">
          לא הצלחנו לשמור את תוצאת המשחק.
        </p>
      )}

      {(status === 'idle' || status === 'paused') && audioError && (
        <p className="home__error" role="alert">
          לא הצלחנו להפעיל את הצלילים. נסו ללחוץ שוב.
        </p>
      )}
    </div>
  );
}
