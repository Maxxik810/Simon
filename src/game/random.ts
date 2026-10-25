import { BOARD_COLORS, type ColorId } from './colors';

// Game randomness only; no crypto RNG needed. Kept outside the reducer (ADR-2)
// so the reducer stays deterministic and tests can mock this module.
export function randomColor(): ColorId {
  const index = Math.floor(Math.random() * BOARD_COLORS.length);
  return BOARD_COLORS[index].id;
}
