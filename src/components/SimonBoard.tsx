import type { KeyboardEvent, PointerEvent } from 'react';
import { BOARD_COLORS, type ColorId } from '../game/colors';
import './SimonBoard.css';

type SimonBoardProps = {
  /** Quadrant that is currently lit (playback or player press) */
  litColor?: ColorId | null;
  /** Player may press the quadrants */
  interactive?: boolean;
  /** Dim the unlit quadrants (sequence playback) */
  dimmed?: boolean;
  onPressStart?: (color: ColorId) => void;
  onPressEnd?: () => void;
};

// Round board built as a 2x2 CSS grid of four semantic buttons (ADR-1).
// Input starts on pointerdown so touch feedback has no delay (ADR-2).
export default function SimonBoard({
  litColor = null,
  interactive = false,
  dimmed = false,
  onPressStart,
  onPressEnd,
}: SimonBoardProps) {
  function handlePointerDown(color: ColorId, event: PointerEvent<HTMLButtonElement>) {
    if (!interactive) return;
    // Only the primary button / a single finger
    if (event.button > 0) return;
    onPressStart?.(color);
  }

  function handleKeyDown(color: ColorId, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!interactive || event.repeat) return;
    onPressStart?.(color);
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    onPressEnd?.();
  }

  return (
    <div className="board" data-dimmed={dimmed ? 'true' : undefined}>
      {BOARD_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className="board__quadrant"
          aria-label={color.label}
          data-color={color.id}
          data-position={color.position}
          data-lit={litColor === color.id ? 'true' : undefined}
          disabled={!interactive}
          onPointerDown={(e) => handlePointerDown(color.id, e)}
          onKeyDown={(e) => handleKeyDown(color.id, e)}
          onKeyUp={handleKeyUp}
          onContextMenu={(e) => e.preventDefault()}
        />
      ))}
      <div className="board__center" aria-hidden="true" />
    </div>
  );
}
