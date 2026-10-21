import { BOARD_COLORS } from '../game/colors';
import './SimonBoard.css';

// Round board built as a 2x2 CSS grid of four semantic buttons (ADR-1).
// Milestone 1: display only. Highlight, dimming and input arrive in Milestone 2.
export default function SimonBoard() {
  return (
    <div className="board">
      {BOARD_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className="board__quadrant"
          aria-label={color.label}
          data-color={color.id}
          data-position={color.position}
        />
      ))}
      <div className="board__center" aria-hidden="true" />
    </div>
  );
}
