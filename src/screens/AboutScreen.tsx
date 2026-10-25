import { useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import HistoryCard from '../components/HistoryCard';
import ConfirmDialog from '../components/ConfirmDialog';
import type { HistoryController } from '../history/useHistory';
import './AboutScreen.css';

export default function AboutScreen({ history }: { history: HistoryController }) {
  const [confirming, setConfirming] = useState(false);
  const { results, loadError, deleteError, clear } = history;

  function confirmDelete() {
    clear();
    setConfirming(false);
  }

  return (
    <div className="about">
      <ScreenHeader title="אודות" />

      <section className="card about__intro" aria-labelledby="about-game-title">
        <h2 id="about-game-title" className="about__title">
          על המשחק
        </h2>
        <p>זכרו את רצף הצבעים שהמשחק מציג, ולחצו על הצבעים באותו סדר.</p>
        <p>בכל שלב מתווסף צבע אחד לרצף. טעות אחת מסיימת את המשחק.</p>
        <p>נסו להגיע עד שלב 10!</p>
      </section>

      <section className="about__history" aria-labelledby="about-history-title">
        <h2 id="about-history-title" className="about__title">
          10 המשחקים האחרונים
        </h2>
        {loadError && (
          <p className="about__error" role="alert">
            לא ניתן לקרוא את ההיסטוריה השמורה.
          </p>
        )}
        {results.length === 0 ? (
          <p className="card about__empty">עדיין אין משחקים שמורים.</p>
        ) : (
          <ul className="about__list">
            {results.map((result) => (
              <HistoryCard key={result.id} result={result} />
            ))}
          </ul>
        )}
        {deleteError && (
          <p className="about__error" role="alert">
            לא הצלחנו למחוק את ההיסטוריה.
          </p>
        )}
        {results.length > 0 && (
          <div className="about__actions">
            <button type="button" className="about__delete" onClick={() => setConfirming(true)}>
              מחק היסטוריה
            </button>
          </div>
        )}
      </section>

      {confirming && <ConfirmDialog onCancel={() => setConfirming(false)} onConfirm={confirmDelete} />}
    </div>
  );
}
