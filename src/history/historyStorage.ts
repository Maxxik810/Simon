// Pure History Repository (ADR-4): no React, every storage access is guarded.
export const HISTORY_KEY = 'simon.history.v1';
export const MAX_RESULTS = 10;

export type GameResult = {
  id: string;
  finishedAt: string;
  completedRounds: number;
  outcome: 'win' | 'loss';
};

type HistoryData = {
  schemaVersion: 1;
  results: GameResult[];
};

export type LoadResult = { ok: boolean; results: GameResult[] };
export type WriteResult = { ok: boolean; results: GameResult[] };

function isValidResult(value: unknown): value is GameResult {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.finishedAt === 'string' &&
    !Number.isNaN(Date.parse(r.finishedAt)) &&
    typeof r.completedRounds === 'number' &&
    Number.isInteger(r.completedRounds) &&
    r.completedRounds >= 0 &&
    r.completedRounds <= 10 &&
    (r.outcome === 'win' || r.outcome === 'loss')
  );
}

export function loadHistory(): LoadResult {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw === null) return { ok: true, results: [] };
    const data = JSON.parse(raw) as Partial<HistoryData> | null;
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.results)) {
      return { ok: false, results: [] };
    }
    return { ok: true, results: data.results.filter(isValidResult).slice(0, MAX_RESULTS) };
  } catch {
    return { ok: false, results: [] };
  }
}

function write(results: GameResult[]): boolean {
  try {
    const data: HistoryData = { schemaVersion: 1, results };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Adds a result at the top and keeps the newest ten. An unreadable store is replaced by a valid one. */
export function addResult(result: GameResult): WriteResult {
  const current = loadHistory().results;
  const next = [result, ...current].slice(0, MAX_RESULTS);
  return write(next) ? { ok: true, results: next } : { ok: false, results: current };
}

export function clearHistory(): boolean {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return localStorage.getItem(HISTORY_KEY) === null;
  } catch {
    return false;
  }
}

export function createResult(outcome: 'won' | 'lost', completedRounds: number, now = new Date()): GameResult {
  return {
    id: `${now.getTime()}-${Math.floor(Math.random() * 1e9).toString(36)}`,
    finishedAt: now.toISOString(),
    completedRounds,
    outcome: outcome === 'won' ? 'win' : 'loss',
  };
}
