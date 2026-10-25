import { describe, expect, it } from 'vitest';
import type { ColorId } from './colors';
import { gameReducer, initialGameState, isRoundComplete, type GameState } from './gameReducer';

const COLORS: ColorId[] = ['green', 'red', 'yellow', 'blue', 'blue', 'green', 'red', 'red', 'yellow', 'blue'];

function startGame(first: ColorId = COLORS[0]): GameState {
  return gameReducer(initialGameState, { type: 'start', firstColor: first });
}

function finishPresentation(state: GameState): GameState {
  return gameReducer(state, { type: 'presentationDone', presentationId: state.presentationId });
}

function repeatSequence(state: GameState): GameState {
  return state.sequence.reduce((s, color) => gameReducer(s, { type: 'press', color }), state);
}

/** Plays correctly until the given round is being presented */
function reachRound(round: number): GameState {
  let state = startGame();
  for (let r = 1; r < round; r++) {
    state = repeatSequence(finishPresentation(state));
    state = gameReducer(state, { type: 'nextRound', nextColor: COLORS[r] });
  }
  return state;
}

describe('gameReducer', () => {
  it('starts with one color in round 1', () => {
    const state = startGame('red');
    expect(state.status).toBe('presenting');
    expect(state.sequence).toEqual(['red']);
    expect(state.round).toBe(1);
    expect(state.completedRounds).toBe(0);
    expect(state.gameId).toBe(1);
  });

  it('has sequence lengths 1, 2 and 10 in rounds 1, 2 and 10, each extending the previous one', () => {
    expect(reachRound(1).sequence).toHaveLength(1);
    const round2 = reachRound(2);
    expect(round2.round).toBe(2);
    expect(round2.sequence).toHaveLength(2);
    const round10 = reachRound(10);
    expect(round10.round).toBe(10);
    expect(round10.sequence).toEqual(COLORS);

    for (let r = 1; r < 10; r++) {
      const prev = reachRound(r).sequence;
      expect(reachRound(r + 1).sequence.slice(0, prev.length)).toEqual(prev);
    }
  });

  it('allows the same color to repeat', () => {
    expect(reachRound(5).sequence.slice(3, 5)).toEqual(['blue', 'blue']);
  });

  it('ignores presses while presenting', () => {
    const state = startGame();
    expect(gameReducer(state, { type: 'press', color: 'green' })).toBe(state);
  });

  it('ignores a stale presentationDone', () => {
    const state = reachRound(2);
    expect(gameReducer(state, { type: 'presentationDone', presentationId: state.presentationId - 1 })).toBe(state);
  });

  it('advances the input on a correct press', () => {
    const state = finishPresentation(reachRound(3));
    const next = gameReducer(state, { type: 'press', color: state.sequence[0] });
    expect(next.status).toBe('awaitingInput');
    expect(next.inputIndex).toBe(1);
  });

  it('loses in round 1 with 0 completed rounds', () => {
    const state = finishPresentation(startGame('green'));
    const lost = gameReducer(state, { type: 'press', color: 'red' });
    expect(lost.status).toBe('lost');
    expect(lost.completedRounds).toBe(0);
  });

  it('loses at once on a wrong press in an advanced round', () => {
    let state = finishPresentation(reachRound(5));
    state = gameReducer(state, { type: 'press', color: state.sequence[0] });
    state = gameReducer(state, { type: 'press', color: 'yellow' }); // expected 'red'
    expect(state.status).toBe('lost');
    expect(state.completedRounds).toBe(4);
    // No more input after losing
    expect(gameReducer(state, { type: 'press', color: 'yellow' })).toBe(state);
  });

  it('marks the round complete and waits for nextRound', () => {
    const state = repeatSequence(finishPresentation(reachRound(2)));
    expect(isRoundComplete(state)).toBe(true);
    expect(state.completedRounds).toBe(2);
    expect(state.round).toBe(2);
    expect(gameReducer(state, { type: 'press', color: 'green' })).toBe(state);
  });

  it('wins after round 10 with 10 completed rounds and has no round 11', () => {
    const won = repeatSequence(finishPresentation(reachRound(10)));
    expect(won.status).toBe('won');
    expect(won.completedRounds).toBe(10);
    expect(won.round).toBe(10);
    expect(gameReducer(won, { type: 'nextRound', nextColor: 'red' })).toBe(won);
  });

  it('dismiss returns to idle only from won/lost and keeps the ids', () => {
    const playing = reachRound(3);
    expect(gameReducer(playing, { type: 'dismiss' })).toBe(playing);

    const lost = gameReducer(finishPresentation(playing), { type: 'press', color: 'yellow' });
    const idle = gameReducer(lost, { type: 'dismiss' });
    expect(idle.status).toBe('idle');
    expect(idle.sequence).toEqual([]);
    expect(idle.round).toBe(1);
    expect(idle.gameId).toBe(lost.gameId);

    const next = gameReducer(idle, { type: 'start', firstColor: 'blue' });
    expect(next.gameId).toBe(lost.gameId + 1);
    expect(next.sequence).toEqual(['blue']);
  });

  it('abandon cancels an active game only', () => {
    const playing = finishPresentation(reachRound(4));
    const idle = gameReducer(playing, { type: 'abandon' });
    expect(idle.status).toBe('idle');
    expect(idle.round).toBe(1);
    expect(idle.presentationId).toBeGreaterThan(playing.presentationId);

    const lost = gameReducer(playing, { type: 'press', color: 'yellow' });
    expect(gameReducer(lost, { type: 'abandon' })).toBe(lost);
    expect(gameReducer(initialGameState, { type: 'abandon' })).toBe(initialGameState);
  });
});
