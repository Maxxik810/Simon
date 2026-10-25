// Playback timing from DESIGN.md 1.1 ("קצב הצגת הרצף"). Same values in every round.
export const MAX_ROUNDS = 10;

/** Light + tone of each color in the sequence */
export const FLASH_MS = 600;
/** Pause between two colors in the sequence */
export const GAP_MS = 250;
/** Wait before the first color of a presentation (after start, or after the next round number appears) */
export const LEAD_IN_MS = 1000;
/** After a round is completed, the finished round number stays on screen this long */
export const ROUND_DONE_MS = 1000;
/** After the final correct press or a wrong press, wait this long before the result message and sound */
export const RESULT_DELAY_MS = 1000;
/** Minimum light + tone of a player press (longer while the finger is held) */
export const PRESS_MIN_MS = 300;
