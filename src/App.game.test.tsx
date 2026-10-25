import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { ColorId } from './game/colors';
import { FLASH_MS, GAP_MS, LEAD_IN_MS, PRESS_MIN_MS, RESULT_DELAY_MS, ROUND_DONE_MS } from './game/timing';

vi.mock('./audio/audioEngine', () => ({
  unlockAudio: vi.fn(async () => true),
  startTone: vi.fn(() => vi.fn()),
  playWin: vi.fn(),
  playLose: vi.fn(),
  stopAll: vi.fn(),
}));

vi.mock('./game/random', () => ({ randomColor: vi.fn() }));

vi.mock('canvas-confetti', () => {
  const confetti = Object.assign(vi.fn(), { reset: vi.fn() });
  return { default: confetti };
});

import App from './App';
import * as audio from './audio/audioEngine';
import { randomColor } from './game/random';
import confetti from 'canvas-confetti';

const LABEL: Record<ColorId, string> = { green: 'ירוק', red: 'אדום', yellow: 'צהוב', blue: 'כחול' };
const WRONG: Record<ColorId, ColorId> = { green: 'red', red: 'yellow', yellow: 'blue', blue: 'green' };
const SEQ: ColorId[] = ['green', 'red', 'red', 'blue', 'yellow', 'green', 'blue', 'yellow', 'red', 'green'];
const SEQ2: ColorId[] = ['blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow'];

function quadrant(color: ColorId) {
  return screen.getByRole('button', { name: LABEL[color] });
}

function litColors() {
  return (['green', 'red', 'yellow', 'blue'] as ColorId[]).filter((c) => quadrant(c).hasAttribute('data-lit'));
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function presentationLength(colors: number) {
  return LEAD_IN_MS + (colors - 1) * (FLASH_MS + GAP_MS) + FLASH_MS;
}

function tap(color: ColorId) {
  fireEvent.pointerDown(quadrant(color), { button: 0 });
  fireEvent.pointerUp(window);
}

async function clickStart() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'התחל משחק' }));
  });
}

/** Repeats the sequence of the given round and moves to the end of the next presentation */
function playRound(round: number, seq: ColorId[]) {
  for (const color of seq.slice(0, round)) tap(color);
  advance(PRESS_MIN_MS);
}

function goTo(screenName: 'בית' | 'אודות') {
  const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
  fireEvent.click(within(nav).getByRole('button', { name: screenName }));
}

function queueColors(seq: ColorId[]) {
  for (const c of seq) vi.mocked(randomColor).mockReturnValueOnce(c);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(audio.unlockAudio).mockResolvedValue(true);
  queueColors(SEQ);
});

afterEach(() => {
  vi.mocked(randomColor).mockReset();
  vi.useRealTimers();
});

describe('Game – Milestone 2', () => {
  it('starts on "התחל משחק" and presents one color with the design timing', async () => {
    render(<App />);
    await clickStart();

    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל משחק' })).not.toBeInTheDocument();
    expect(audio.unlockAudio).toHaveBeenCalledTimes(1);

    advance(LEAD_IN_MS - 1);
    expect(litColors()).toEqual([]);
    advance(1);
    expect(litColors()).toEqual(['green']);
    expect(audio.startTone).toHaveBeenLastCalledWith('green');
    advance(FLASH_MS - 1);
    expect(litColors()).toEqual(['green']);
    advance(1);
    expect(litColors()).toEqual([]);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.getByText('הקש על הצבעים לפי הסדר')).toBeInTheDocument();
  });

  it('ignores presses while the sequence is presented', async () => {
    render(<App />);
    await clickStart();
    advance(LEAD_IN_MS + 100);

    expect(quadrant('red')).toBeDisabled();
    fireEvent.pointerDown(quadrant('red'), { button: 0 });
    advance(presentationLength(1));

    // Still round 1 and the wrong color did not lose the game
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.queryByText('נפסלת!')).not.toBeInTheDocument();
  });

  it('keeps the same pace in an advanced round and grows the sequence by one', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));

    for (let round = 1; round <= 3; round++) {
      playRound(round, SEQ);
      // The finished round number stays on screen, then the next one appears
      expect(screen.getByText(`שלב ${round} מתוך 10`)).toBeInTheDocument();
      advance(ROUND_DONE_MS - PRESS_MIN_MS);
      expect(screen.getByText(`שלב ${round + 1} מתוך 10`)).toBeInTheDocument();
      expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();

      // Same lead-in, flash and gap as round 1
      const shown: ColorId[] = [];
      advance(LEAD_IN_MS);
      for (let i = 0; i <= round; i++) {
        shown.push(...litColors());
        advance(FLASH_MS);
        expect(litColors()).toEqual([]);
        if (i < round) advance(GAP_MS);
      }
      expect(shown).toEqual(SEQ.slice(0, round + 1));
      expect(screen.getByText('התור שלך')).toBeInTheDocument();
    }
  });

  it('loses in round 1 with 0 completed rounds: press tone at once, loss one second later, no confetti', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));

    vi.mocked(audio.startTone).mockClear();
    fireEvent.pointerDown(quadrant('blue'), { button: 0 });
    expect(audio.startTone).toHaveBeenCalledWith('blue');
    expect(litColors()).toEqual(['blue']);
    fireEvent.pointerUp(window);

    advance(RESULT_DELAY_MS - 1);
    expect(screen.queryByText('נפסלת!')).not.toBeInTheDocument();
    expect(audio.playLose).not.toHaveBeenCalled();
    advance(1);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('לא השלמת אף שלב')).toBeInTheDocument();
    expect(audio.playLose).toHaveBeenCalledTimes(1);
    expect(audio.playWin).not.toHaveBeenCalled();
    expect(confetti).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'אישור' })).toBeInTheDocument();
  });

  it('loses in an advanced round on the first wrong press', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));
    for (let round = 1; round <= 4; round++) {
      playRound(round, SEQ);
      advance(ROUND_DONE_MS - PRESS_MIN_MS);
      advance(presentationLength(round + 1));
    }

    expect(screen.getByText('שלב 5 מתוך 10')).toBeInTheDocument();
    tap(SEQ[0]);
    tap(SEQ[1]);
    tap(WRONG[SEQ[2]]);
    // No more input after the mistake
    expect(quadrant(SEQ[3])).toBeDisabled();
    advance(RESULT_DELAY_MS);

    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('השלמת 4 שלבים')).toBeInTheDocument();
    expect(screen.getByText('שלב 5 מתוך 10')).toBeInTheDocument();
  });

  it('wins after round 10 with confetti, has no round 11, and "אישור" + start creates a new sequence', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));
    for (let round = 1; round <= 9; round++) {
      playRound(round, SEQ);
      advance(ROUND_DONE_MS - PRESS_MIN_MS);
      advance(presentationLength(round + 1));
    }
    expect(screen.getByText('שלב 10 מתוך 10')).toBeInTheDocument();
    expect(randomColor).toHaveBeenCalledTimes(10);

    playRound(10, SEQ);
    advance(RESULT_DELAY_MS - PRESS_MIN_MS);

    expect(screen.getByText('כל הכבוד! ניצחת!')).toBeInTheDocument();
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(audio.playLose).not.toHaveBeenCalled();
    expect(confetti).toHaveBeenCalledTimes(1);

    // No round 11, no more random colors
    advance(10_000);
    expect(screen.getByText('שלב 10 מתוך 10')).toBeInTheDocument();
    expect(screen.queryByText('שלב 11 מתוך 10')).not.toBeInTheDocument();
    expect(randomColor).toHaveBeenCalledTimes(10);

    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    expect(confetti.reset).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(audio.playWin).toHaveBeenCalledTimes(1);

    // A new game draws a new sequence
    vi.mocked(randomColor).mockReset();
    queueColors(SEQ2);
    await clickStart();
    expect(randomColor).toHaveBeenCalledTimes(1);
    advance(LEAD_IN_MS);
    expect(litColors()).toEqual(['blue']);
  });

  it('starts a new game after a loss with a fresh first color', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));
    tap('red');
    advance(RESULT_DELAY_MS);
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));

    vi.mocked(randomColor).mockReset();
    queueColors(SEQ2);
    await clickStart();
    advance(LEAD_IN_MS);
    expect(litColors()).toEqual(['blue']);
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
  });

  it('shows a Hebrew message and does not start when sound cannot be enabled', async () => {
    vi.mocked(audio.unlockAudio).mockResolvedValueOnce(false);
    render(<App />);
    await clickStart();

    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו להפעיל את הצלילים. נסו ללחוץ שוב.');
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    advance(5000);
    expect(litColors()).toEqual([]);

    // Retry from a new gesture
    await clickStart();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
  });
});

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

async function clickResume() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'המשך משחק' }));
  });
}

/** Starts a game and moves to the presentation of round 2 (first color lit) */
async function reachRound2Presenting() {
  render(<App />);
  await clickStart();
  advance(presentationLength(1));
  playRound(1, SEQ);
  advance(ROUND_DONE_MS - PRESS_MIN_MS);
  advance(LEAD_IN_MS + 100);
  expect(litColors()).toEqual(['green']);
}

function expectPausedHome(round: number) {
  expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
  expect(screen.getByText(`שלב ${round} מתוך 10`)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'התחל משחק' })).not.toBeInTheDocument();
  expect(litColors()).toEqual([]);
  expect(quadrant('green')).toBeDisabled();
}

describe('Pause and resume – Milestone 3', () => {
  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  });

  it('going to "About" during the presentation pauses at once and nothing resumes by itself', async () => {
    await reachRound2Presenting();
    const stopCalls = vi.mocked(audio.stopAll).mock.calls.length;

    goTo('אודות');
    expect(vi.mocked(audio.stopAll).mock.calls.length).toBeGreaterThan(stopCalls);
    expect(vi.getTimerCount()).toBe(0);

    goTo('בית');
    expectPausedHome(2);
    const tones = vi.mocked(audio.startTone).mock.calls.length;
    advance(10_000);
    expect(litColors()).toEqual([]);
    expect(audio.startTone).toHaveBeenCalledTimes(tones);
    expect(screen.queryByText('נפסלת!')).not.toBeInTheDocument();
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
  });

  it('going to "About" during the player turn (after part of the input, color held) pauses', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));
    playRound(1, SEQ);
    advance(ROUND_DONE_MS - PRESS_MIN_MS);
    advance(presentationLength(2));

    tap(SEQ[0]);
    fireEvent.pointerDown(quadrant(SEQ[1]), { button: 0 });
    goTo('אודות');
    expect(vi.getTimerCount()).toBe(0);
    goTo('בית');
    expectPausedHome(2);

    // Presses are ignored while paused
    fireEvent.pointerDown(quadrant('yellow'), { button: 0 });
    fireEvent.pointerUp(window);
    expect(screen.queryByText('נפסלת!')).not.toBeInTheDocument();
  });

  it('"המשך משחק" replays the full sequence of the same round, then the round is repeated from the start', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));
    playRound(1, SEQ);
    advance(ROUND_DONE_MS - PRESS_MIN_MS);
    advance(presentationLength(2));
    tap(SEQ[0]); // partial input
    advance(PRESS_MIN_MS);

    goTo('אודות');
    goTo('בית');
    const randomCalls = vi.mocked(randomColor).mock.calls.length;
    vi.mocked(audio.startTone).mockClear();
    await clickResume();

    expect(audio.unlockAudio).toHaveBeenCalledTimes(2);
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(screen.getByText('שלב 2 מתוך 10')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).not.toBeInTheDocument();

    advance(LEAD_IN_MS - 1);
    expect(litColors()).toEqual([]);
    advance(1);
    expect(litColors()).toEqual([SEQ[0]]);
    advance(FLASH_MS + GAP_MS);
    expect(litColors()).toEqual([SEQ[1]]);
    advance(FLASH_MS);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(vi.mocked(audio.startTone).mock.calls.map((c) => c[0])).toEqual(SEQ.slice(0, 2));
    // No new color was added
    expect(randomColor).toHaveBeenCalledTimes(randomCalls);

    // Full repeat from the start moves to round 3
    playRound(2, SEQ);
    advance(ROUND_DONE_MS - PRESS_MIN_MS);
    expect(screen.getByText('שלב 3 מתוך 10')).toBeInTheDocument();
  });

  it('pausing right after a completed round keeps the same round', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));
    playRound(1, SEQ);
    goTo('אודות');
    goTo('בית');
    advance(10_000);
    expectPausedHome(1);
    await clickResume();
    advance(presentationLength(1));
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
  });

  it('a double click on "המשך משחק" starts only one replay', async () => {
    await reachRound2Presenting();
    goTo('אודות');
    goTo('בית');
    const button = screen.getByRole('button', { name: 'המשך משחק' });
    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    expect(audio.unlockAudio).toHaveBeenCalledTimes(2); // start + one resume
    vi.mocked(audio.startTone).mockClear();
    advance(presentationLength(2));
    expect(audio.startTone).toHaveBeenCalledTimes(2);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
  });

  it('stays paused with a message when sound cannot start, and a new press retries', async () => {
    await reachRound2Presenting();
    goTo('אודות');
    goTo('בית');
    vi.mocked(audio.unlockAudio).mockResolvedValueOnce(false);
    await clickResume();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expectPausedHome(2);
    advance(10_000);
    expect(litColors()).toEqual([]);

    await clickResume();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
  });

  it('hiding the app pauses; coming back does not resume', async () => {
    await reachRound2Presenting();
    setVisibility('hidden');
    expect(vi.getTimerCount()).toBe(0);
    expect(litColors()).toEqual([]);
    setVisibility('visible');
    advance(10_000);
    expectPausedHome(2);
  });

  it('pagehide pauses during the player turn', async () => {
    render(<App />);
    await clickStart();
    advance(presentationLength(1));
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expectPausedHome(1);
  });

  it('hiding the app does not touch an idle or finished game', async () => {
    render(<App />);
    setVisibility('hidden');
    setVisibility('visible');
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();

    await clickStart();
    advance(presentationLength(1));
    tap(WRONG[SEQ[0]]);
    setVisibility('hidden');
    setVisibility('visible');
    advance(RESULT_DELAY_MS);
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.queryByText('המשחק מושהה')).not.toBeInTheDocument();
  });

  it('a new page load starts from the beginning after a pause', async () => {
    const { unmount } = render(<App />);
    await clickStart();
    advance(presentationLength(1));
    goTo('אודות');
    unmount();

    render(<App />);
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).not.toBeInTheDocument();
  });
});
