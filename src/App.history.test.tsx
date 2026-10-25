import { StrictMode } from 'react';
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
import { randomColor } from './game/random';
import { HISTORY_KEY, loadHistory } from './history/historyStorage';

const LABEL: Record<ColorId, string> = { green: 'ירוק', red: 'אדום', yellow: 'צהוב', blue: 'כחול' };
const SEQ: ColorId[] = ['green', 'red', 'red', 'blue', 'yellow', 'green', 'blue', 'yellow', 'red', 'green'];

function quadrant(color: ColorId) {
  return screen.getByRole('button', { name: LABEL[color] });
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

function goTo(name: 'בית' | 'אודות') {
  const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
  fireEvent.click(within(nav).getByRole('button', { name }));
}

async function clickStart() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'התחל משחק' }));
  });
}

function queue() {
  vi.mocked(randomColor).mockReset();
  for (const c of SEQ) vi.mocked(randomColor).mockReturnValueOnce(c);
}

/** Starts a game and loses it in round 1 */
async function playLoss() {
  queue();
  await clickStart();
  advance(presentationLength(1));
  tap('blue');
  advance(RESULT_DELAY_MS);
}

async function playWin() {
  queue();
  await clickStart();
  advance(presentationLength(1));
  for (let round = 1; round <= 10; round++) {
    for (const color of SEQ.slice(0, round)) tap(color);
    advance(PRESS_MIN_MS);
    if (round < 10) {
      advance(ROUND_DONE_MS - PRESS_MIN_MS);
      advance(presentationLength(round + 1));
    }
  }
  advance(RESULT_DELAY_MS);
}

function dismiss() {
  fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.mocked(randomColor).mockReset();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('History – Milestone 4', () => {
  it('shows an empty state and no delete button without saved games', () => {
    render(<App />);
    goTo('אודות');
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).not.toBeInTheDocument();
  });

  it('saves exactly one loss with 0 rounds, even in Strict Mode', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await playLoss();
    const { results } = loadHistory();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ outcome: 'loss', completedRounds: 0 });

    dismiss();
    goTo('אודות');
    expect(screen.getByText('הפסד')).toBeInTheDocument();
    expect(screen.getByText('לא הושלם אף שלב')).toBeInTheDocument();
    expect(loadHistory().results).toHaveLength(1);
  });

  it('saves a win with 10 rounds', async () => {
    render(<App />);
    await playWin();
    expect(screen.getByText('כל הכבוד! ניצחת!')).toBeInTheDocument();
    expect(loadHistory().results).toHaveLength(1);
    expect(loadHistory().results[0]).toMatchObject({ outcome: 'win', completedRounds: 10 });
    dismiss();
    goTo('אודות');
    expect(screen.getByText('ניצחון')).toBeInTheDocument();
    expect(screen.getByText('הושלמו 10 שלבים')).toBeInTheDocument();
  });

  it('does not save on pause, navigation, visibility change or an unfinished game', async () => {
    const { unmount } = render(<App />);
    queue();
    await clickStart();
    advance(presentationLength(1));
    goTo('אודות');
    goTo('בית');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    fireEvent(document, new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    advance(10000);
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();

    // Refresh mid-game: a new App starts idle with nothing saved
    unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('keeps ten games after eleven, newest first, and they survive a new render', async () => {
    const { unmount } = render(<App />);
    for (let i = 0; i < 11; i++) {
      await playLoss();
      dismiss();
    }
    expect(loadHistory().results).toHaveLength(10);
    unmount();
    render(<App />);
    goTo('אודות');
    expect(screen.getAllByText('הפסד')).toHaveLength(10);
  });

  it('cancel keeps the history, delete empties it after confirmation', async () => {
    render(<App />);
    await playLoss();
    dismiss();
    goTo('אודות');

    fireEvent.click(screen.getByRole('button', { name: 'מחק היסטוריה' }));
    expect(screen.getByText('למחוק את ההיסטוריה?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(screen.queryByText('למחוק את ההיסטוריה?')).not.toBeInTheDocument();
    expect(screen.getByText('הפסד')).toBeInTheDocument();
    expect(loadHistory().results).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'מחק היסטוריה' }));
    fireEvent.click(screen.getByRole('button', { name: 'מחק' }));
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).not.toBeInTheDocument();
    expect(loadHistory().results).toHaveLength(0);
  });

  it('does not block the game and shows a Hebrew message when saving fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<App />);
    await playLoss();
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('לא הצלחנו לשמור את תוצאת המשחק.')).toBeInTheDocument();
    dismiss();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
  });

  it('keeps the list and shows a message when deleting fails', async () => {
    render(<App />);
    await playLoss();
    dismiss();
    goTo('אודות');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    fireEvent.click(screen.getByRole('button', { name: 'מחק היסטוריה' }));
    fireEvent.click(screen.getByRole('button', { name: 'מחק' }));
    expect(screen.getByText('לא הצלחנו למחוק את ההיסטוריה.')).toBeInTheDocument();
    expect(screen.getByText('הפסד')).toBeInTheDocument();
  });

  it('shows a Hebrew message when saved history cannot be read', () => {
    localStorage.setItem(HISTORY_KEY, '{oops');
    render(<App />);
    goTo('אודות');
    expect(screen.getByText('לא ניתן לקרוא את ההיסטוריה השמורה.')).toBeInTheDocument();
  });
});
