import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { playLose, playWin, startTone, stopAll, unlockAudio } from '../audio/audioEngine';
import type { ColorId } from './colors';
import { gameReducer, initialGameState, isRoundComplete } from './gameReducer';
import { randomColor } from './random';
import {
  FLASH_MS,
  GAP_MS,
  LEAD_IN_MS,
  PRESS_MIN_MS,
  RESULT_DELAY_MS,
  ROUND_DONE_MS,
} from './timing';

type ActivePress = {
  color: ColorId;
  stopTone: () => void;
  startedAt: number;
  released: boolean;
  minTimer: ReturnType<typeof setTimeout> | null;
};

const CONFETTI_COLORS = ['#00D26A', '#FF3B30', '#FFD600', '#00A3FF', '#FFFFFF'];

// Connects the pure reducer to timers, highlights, audio and confetti.
// Owned by App so that switching screens does not unmount it (ADR-2).
export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  // Color lit by the sequence playback
  const [playbackColor, setPlaybackColor] = useState<ColorId | null>(null);
  // Color lit by the player's press
  const [pressedColor, setPressedColor] = useState<ColorId | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const pressRef = useRef<ActivePress | null>(null);
  const startingRef = useRef(false);

  const roundComplete = isRoundComplete(state);

  // --- Player press highlight + tone ---------------------------------------

  const finishPress = useCallback(() => {
    const press = pressRef.current;
    if (!press) return;
    if (press.minTimer) clearTimeout(press.minTimer);
    press.stopTone();
    pressRef.current = null;
    setPressedColor(null);
  }, []);

  const pressStart = useCallback(
    (color: ColorId) => {
      const current = stateRef.current;
      if (current.status !== 'awaitingInput' || isRoundComplete(current)) return;
      finishPress();
      // Light and sound start immediately, also for a wrong press (PRD 4.2)
      pressRef.current = {
        color,
        stopTone: startTone(color),
        startedAt: Date.now(),
        released: false,
        minTimer: null,
      };
      setPressedColor(color);
      dispatch({ type: 'press', color });
    },
    [finishPress],
  );

  // Lit while held, and at least PRESS_MIN_MS
  const pressEnd = useCallback(() => {
    const press = pressRef.current;
    if (!press || press.released) return;
    press.released = true;
    const remaining = PRESS_MIN_MS - (Date.now() - press.startedAt);
    if (remaining <= 0) {
      finishPress();
    } else {
      press.minTimer = setTimeout(finishPress, remaining);
    }
  }, [finishPress]);

  // The quadrant may become disabled before the finger is lifted,
  // so the release is caught on the window (ADR-2).
  useEffect(() => {
    window.addEventListener('pointerup', pressEnd);
    window.addEventListener('pointercancel', pressEnd);
    return () => {
      window.removeEventListener('pointerup', pressEnd);
      window.removeEventListener('pointercancel', pressEnd);
    };
  }, [pressEnd]);

  // --- Sequence playback ---------------------------------------------------

  useEffect(() => {
    if (state.status !== 'presenting') return;
    const presentationId = state.presentationId;
    const sequence = state.sequence;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let stopCurrentTone: (() => void) | null = null;
    const step = FLASH_MS + GAP_MS;

    sequence.forEach((color, i) => {
      const onAt = LEAD_IN_MS + i * step;
      timers.push(
        setTimeout(() => {
          stopCurrentTone = startTone(color);
          setPlaybackColor(color);
        }, onAt),
      );
      timers.push(
        setTimeout(() => {
          stopCurrentTone?.();
          stopCurrentTone = null;
          setPlaybackColor(null);
        }, onAt + FLASH_MS),
      );
    });
    timers.push(
      setTimeout(
        () => dispatch({ type: 'presentationDone', presentationId }),
        LEAD_IN_MS + (sequence.length - 1) * step + FLASH_MS,
      ),
    );

    // Cancelled on round change, end of game, "About" or unmount
    return () => {
      timers.forEach(clearTimeout);
      stopCurrentTone?.();
      setPlaybackColor(null);
    };
  }, [state.status, state.presentationId, state.sequence]);

  // --- Next round ----------------------------------------------------------

  useEffect(() => {
    if (!roundComplete) return;
    // The finished round number stays on screen, then the next round starts
    const timer = setTimeout(
      () => dispatch({ type: 'nextRound', nextColor: randomColor() }),
      ROUND_DONE_MS,
    );
    return () => clearTimeout(timer);
  }, [roundComplete, state.gameId, state.round]);

  // --- End of game ---------------------------------------------------------

  useEffect(() => {
    if (state.status !== 'won' && state.status !== 'lost') return;
    const won = state.status === 'won';
    // Message and end sound appear together, one second after the last press
    const timer = setTimeout(() => {
      setResultVisible(true);
      if (won) {
        playWin();
        void confetti({
          particleCount: 160,
          spread: 100,
          startVelocity: 40,
          origin: { y: 0.45 },
          colors: CONFETTI_COLORS,
          disableForReducedMotion: true,
        });
      } else {
        playLose();
      }
    }, RESULT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.status, state.gameId]);

  // Stop everything if the app unmounts
  useEffect(
    () => () => {
      stopAll();
      confetti.reset();
    },
    [],
  );

  // --- Commands ------------------------------------------------------------

  const startGame = useCallback(async () => {
    if (stateRef.current.status !== 'idle' || startingRef.current) return;
    startingRef.current = true;
    setAudioError(false);
    // Called inside the button's gesture so the browser allows sound
    const ok = await unlockAudio();
    startingRef.current = false;
    if (!ok) {
      setAudioError(true);
      return;
    }
    dispatch({ type: 'start', firstColor: randomColor() });
  }, []);

  const dismissResult = useCallback(() => {
    setResultVisible(false);
    confetti.reset();
    dispatch({ type: 'dismiss' });
  }, []);

  // Temporary Milestone 2 behavior: leaving to "About" mid-game cancels it
  const abandonGame = useCallback(() => {
    const status = stateRef.current.status;
    if (status !== 'presenting' && status !== 'awaitingInput') return;
    finishPress();
    stopAll();
    setPlaybackColor(null);
    dispatch({ type: 'abandon' });
  }, [finishPress]);

  return {
    state,
    roundComplete,
    litColor: playbackColor ?? pressedColor,
    resultVisible,
    audioError,
    startGame,
    dismissResult,
    abandonGame,
    pressStart,
    pressEnd,
  };
}

export type GameController = ReturnType<typeof useGame>;
