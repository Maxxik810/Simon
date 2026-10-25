import './ResultOverlay.css';

type ResultOverlayProps = {
  outcome: 'won' | 'lost';
  completedRounds: number;
};

function completedText(count: number): string {
  if (count === 0) return 'לא השלמת אף שלב';
  if (count === 1) return 'השלמת שלב אחד';
  return `השלמת ${count} שלבים`;
}

// End-of-game message shown over the board (DESIGN 1.1). The "אישור" button
// lives in the action area under the board, as in the mockups.
export default function ResultOverlay({ outcome, completedRounds }: ResultOverlayProps) {
  const won = outcome === 'won';
  return (
    <div
      className="result"
      role="dialog"
      aria-labelledby="result-title"
      aria-describedby="result-detail"
      data-outcome={outcome}
    >
      <h2 id="result-title" className="result__title">
        {won ? 'כל הכבוד! ניצחת!' : 'נפסלת!'}
      </h2>
      <p id="result-detail" className="result__detail">
        {won ? 'השלמת את כל 10 השלבים' : completedText(completedRounds)}
      </p>
    </div>
  );
}
