import type { GameResult } from '../history/historyStorage';
import './HistoryCard.css';

function roundsText(count: number): string {
  if (count === 0) return 'לא הושלם אף שלב';
  if (count === 1) return 'הושלם שלב אחד';
  return `הושלמו ${count} שלבים`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
}

export default function HistoryCard({ result }: { result: GameResult }) {
  const won = result.outcome === 'win';
  return (
    <li className="card history-card" data-outcome={result.outcome}>
      <div className="history-card__info">
        <span className="history-card__date">{formatDate(result.finishedAt)}</span>
        <span className="history-card__rounds">{roundsText(result.completedRounds)}</span>
      </div>
      <span className="history-card__badge">{won ? 'ניצחון' : 'הפסד'}</span>
    </li>
  );
}
