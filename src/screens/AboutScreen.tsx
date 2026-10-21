import ScreenHeader from '../components/ScreenHeader';
import './AboutScreen.css';

// Milestone 1: instructions and an empty history. Stored results arrive in Milestone 4.
export default function AboutScreen() {
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
        <p className="card about__empty">עדיין אין משחקים שמורים.</p>
      </section>
    </div>
  );
}
