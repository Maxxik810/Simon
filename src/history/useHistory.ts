import { useCallback, useState } from 'react';
import { addResult, clearHistory, loadHistory, type GameResult } from './historyStorage';

// History state for App: the saved list plus one error flag per operation.
export function useHistory() {
  const [initial] = useState(loadHistory);
  const [results, setResults] = useState<GameResult[]>(initial.results);
  const [loadError, setLoadError] = useState(!initial.ok);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const save = useCallback((result: GameResult) => {
    const res = addResult(result);
    setResults(res.results);
    setSaveError(!res.ok);
    if (res.ok) setLoadError(false);
  }, []);

  const clear = useCallback(() => {
    const ok = clearHistory();
    setDeleteError(!ok);
    if (ok) {
      setResults([]);
      setLoadError(false);
    }
    return ok;
  }, []);

  const resetSaveError = useCallback(() => setSaveError(false), []);

  return { results, loadError, saveError, deleteError, save, clear, resetSaveError };
}

export type HistoryController = ReturnType<typeof useHistory>;
