import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HISTORY_KEY, addResult, clearHistory, createResult, loadHistory } from './historyStorage';

function make(n: number) {
  return createResult('lost', n % 11, new Date(2026, 0, 1, 10, n));
}

describe('historyStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts empty and ok', () => {
    expect(loadHistory()).toEqual({ ok: true, results: [] });
  });

  it('adds newest first', () => {
    const a = make(1);
    const b = make(2);
    addResult(a);
    addResult(b);
    expect(loadHistory().results.map((r) => r.id)).toEqual([b.id, a.id]);
  });

  it('keeps only ten, dropping the oldest', () => {
    const all = Array.from({ length: 11 }, (_, i) => make(i));
    all.forEach(addResult);
    const { results } = loadHistory();
    expect(results).toHaveLength(10);
    expect(results[0].id).toBe(all[10].id);
    expect(results.some((r) => r.id === all[0].id)).toBe(false);
  });

  it('maps outcomes', () => {
    expect(createResult('won', 10).outcome).toBe('win');
    expect(createResult('lost', 0).outcome).toBe('loss');
  });

  it('reports corrupt JSON and recovers on the next save', () => {
    localStorage.setItem(HISTORY_KEY, '{oops');
    expect(loadHistory().ok).toBe(false);
    const r = make(1);
    expect(addResult(r).ok).toBe(true);
    expect(loadHistory()).toEqual({ ok: true, results: [r] });
  });

  it('filters invalid entries', () => {
    const good = make(1);
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({ schemaVersion: 1, results: [{ id: 1 }, good, null, { ...good, completedRounds: 99 }] }),
    );
    expect(loadHistory().results).toEqual([good]);
  });

  it('reports storage failures without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadHistory().ok).toBe(false);
    expect(addResult(make(1)).ok).toBe(false);
    expect(clearHistory()).toBe(false);
  });

  it('clears the history', () => {
    addResult(make(1));
    expect(clearHistory()).toBe(true);
    expect(loadHistory().results).toEqual([]);
  });
});
