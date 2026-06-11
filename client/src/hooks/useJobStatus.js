import { useEffect, useRef, useState } from 'react';
import { getAssetStatus } from '../api/client.js';

const TERMINAL = ['COMPLETED', 'FAILED'];

/**
 * Long-polls an asset's status until it reaches a terminal state.
 * (1-frontend-ui.md permits WebSockets or Long Polling; we use polling.)
 *
 * @param {string|null} assetId
 * @param {{ intervalMs?: number, enabled?: boolean }} options
 * @returns {{ status: string|null, error: string|null, isPolling: boolean }}
 */
export function useJobStatus(assetId, { intervalMs = 3000, enabled = true } = {}) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!assetId || !enabled) return undefined;

    let cancelled = false;

    async function poll() {
      try {
        const data = await getAssetStatus(assetId);
        if (cancelled) return;
        setStatus(data.status);
        if (TERMINAL.includes(data.status)) return; // stop scheduling
      } catch (err) {
        if (cancelled) return;
        const apiErr = err?.response?.data?.error;
        setError(typeof apiErr === 'string' ? apiErr : (apiErr?.message || err.message || 'An error occurred'));
      }
      timer.current = setTimeout(poll, intervalMs);
    }

    poll();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [assetId, intervalMs, enabled]);

  return { status, error, isPolling: status !== null && !TERMINAL.includes(status) };
}
