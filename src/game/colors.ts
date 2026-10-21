export type ColorId = 'green' | 'red' | 'yellow' | 'blue';

export type BoardPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type BoardColor = {
  id: ColorId;
  /** Hebrew accessible name of the quadrant */
  label: string;
  /** Spatial position on the board; does not flip in RTL (ADR-1) */
  position: BoardPosition;
};

// Layout follows the mockups, which override the wireframes (DESIGN.md 1.1).
export const BOARD_COLORS: ReadonlyArray<BoardColor> = [
  { id: 'green', label: 'ירוק', position: 'top-left' },
  { id: 'red', label: 'אדום', position: 'top-right' },
  { id: 'yellow', label: 'צהוב', position: 'bottom-left' },
  { id: 'blue', label: 'כחול', position: 'bottom-right' },
];
