import { config } from '../../config/env.js';
import { startMockJob } from './mock.js';
import { startKiriJob } from './kiri.js';

// Resolve the active provider once, with a safe fallback: if 'kiri' is selected
// but no API key is configured, fall back to the mock so the app still works.
function resolveProvider() {
  const { provider, kiri } = config.photogrammetry;
  if (provider === 'kiri') {
    if (!kiri.apiKey) {
      console.warn('[photogrammetry] PHOTOGRAMMETRY_PROVIDER=kiri but KIRI_API_KEY is empty — falling back to mock.');
      return 'mock';
    }
    return 'kiri';
  }
  return 'mock';
}

const ACTIVE = resolveProvider();
console.log(`[photogrammetry] provider: ${ACTIVE}`);

/**
 * Start a photogrammetry job for a video asset.
 * @param {{ assetId: string, jobId: string, sourceVideoKey?: string }} job
 */
export function startPhotogrammetryJob(job) {
  if (ACTIVE === 'kiri') return startKiriJob(job);
  return startMockJob(job);
}
