// Loads data from the backend and tracks loading / error state.
// Usage: const { data, loading, error, reload } = useApi(() => workoutApi.list(), []);
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors';

export default function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0); // ignores responses from older, slower requests

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id === requestId.current) setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  // reload() refreshes without showing the full-page spinner again
  const reload = useCallback(() => load({ silent: true }), [load]);

  return { data, setData, loading, error, reload };
}
