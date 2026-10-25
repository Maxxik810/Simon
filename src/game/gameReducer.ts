import type { ColorId } from './colors';
import { MAX_ROUNDS } from './timing';

export type GameStatus = 'idle' | 'presenting' | 'awaitingInput' | 'paused' | 'won' | 'lost';

export type GameState = {
  status: GameStatus;
  sequence: ColorId[];
  /** Current round, 1-10 */
  round: number;
  /** Index of the next expected press. Equals sequence.length once the round is fully repeated. */
  inputIndex: number;
  completedRounds: number;
  /** Increases on every new game; used later to save each result once */
  gameId: number;
  /** Increases on every new presentation; stale playback callbacks are ignored */
  presentationId: number;
};

export type GameAction =
  | { type: 'start'; firstColor: ColorId }
  | { type: 'presentationDone'; presentationId: number }
  | { type: 'press'; color: ColorId }
  | { type: 'nextRound'; nextColor: ColorId }
  | { type: 'dismiss' }
  | { type: 'pause' }
  | { type: 'resume' };

export const initialGameState: GameState = {
  status: 'idle',
  sequence: [],
  round: 1,
  inputIndex: 0,
  completedRounds: 0,
  gameId: 0,
  presentationId: 0,
};

/** True while the player has repeated the whole round and waits for the next one */
export function isRoundComplete(state: GameState): boolean {
  return state.status === 'awaitingInput' && state.inputIndex >= state.sequence.length;
}

// Pure state machine (ARCHITECTURE 2.3). Any action that is not valid in the
// current state returns the same state object unchanged.
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      if (state.status !== 'idle') return state;
      return {
        status: 'presenting',
        sequence: [action.firstColor],
        round: 1,
        inputIndex: 0,
        completedRounds: 0,
        gameId: state.gameId + 1,
        presentationId: state.presentationId + 1,
      };

    case 'presentationDone':
      if (state.status !== 'presenting' || action.presentationId !== state.presentationId) {
        return state;
      }
      return { ...state, status: 'awaitingInput', inputIndex: 0 };

    case 'press': {
      if (state.status !== 'awaitingInput' || isRoundComplete(state)) return state;
      if (action.color !== state.sequence[state.inputIndex]) {
        return { ...state, status: 'lost', completedRounds: state.round - 1 };
      }
      const inputIndex = state.inputIndex + 1;
      if (inputIndex < state.sequence.length) {
        return { ...state, inputIndex };
      }
      if (state.round >= MAX_ROUNDS) {
        return { ...state, status: 'won', inputIndex, completedRounds: MAX_ROUNDS };
      }
      return { ...state, inputIndex, completedRounds: state.round };
    }

    case 'nextRound':
      if (!isRoundComplete(state) || state.round >= MAX_ROUNDS) return state;
      return {
        ...state,
        status: 'presenting',
        sequence: [...state.sequence, action.nextColor],
        round: state.round + 1,
        inputIndex: 0,
        presentationId: state.presentationId + 1,
      };

    case 'dismiss':
      if (state.status !== 'won' && state.status !== 'lost') return state;
      return { ...initialGameState, gameId: state.gameId, presentationId: state.presentationId };

    // ADR-3: keep sequence and round, drop partial input. A round that was
    // just completed (waiting for the next one) counts as not completed.
    case 'pause':
      if (state.status !== 'presenting' && state.status !== 'awaitingInput') return state;
      return {
        ...state,
        status: 'paused',
        inputIndex: 0,
        completedRounds: state.round - 1,
        presentationId: state.presentationId + 1,
      };

    // Replays the full sequence of the same round as a new presentation
    case 'resume':
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'presenting',
        inputIndex: 0,
        presentationId: state.presentationId + 1,
      };

    default:
      return state;
  }
}
