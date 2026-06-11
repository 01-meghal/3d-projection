import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { config } from '../../config/env.js';
import { AiJob } from '../../models/AiJob.js';
import { BUCKETS, putObjectFromFile } from '../storage.js';
import { notifyCompletion, notifyFailure } from './notify.js';

// ---------------------------------------------------------------------------
// Mock photogrammetry provider (see 5-ai-processing.md).
//
// Doesn't look at the video — after AI_MOCK_DELAY_MS it emits a bundled sample
// model and reports completion. Proves the async pipeline end-to-end without a
// real (paid, GPU-heavy) reconstruction service.
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = path.resolve(__dirname, '../../assets/samples');

async function firstExistingSample(candidates) {
  for (const name of candidates) {
    const p = path.join(SAMPLES_DIR, name);
    try {
      await fs.access(p);
      return p;
    } catch {
      // try next
    }
  }
  return null;
}

export function startMockJob({ assetId, jobId }) {
  console.log(`[mock] job ${jobId} queued for asset ${assetId}`);

  setTimeout(async () => {
    try {
      await AiJob.findByIdAndUpdate(jobId, { status: 'PROCESSING' });
      console.log(`[mock] job ${jobId} processing...`);

      // Optional deterministic failure to exercise the FAILED path.
      const failureRoll = (jobId.charCodeAt(jobId.length - 1) % 100) / 100;
      if (config.ai.mockFailureRate > 0 && failureRoll < config.ai.mockFailureRate) {
        await notifyFailure({
          jobId,
          assetId,
          error: 'Mock failure: featureless environment / reflective surfaces.',
        });
        return;
      }

      const glb = await firstExistingSample(['sample.glb']);
      const usdz = await firstExistingSample(['sample.usdz']);
      if (!glb) {
        await notifyFailure({
          jobId,
          assetId,
          error: 'No sample model available (server/src/assets/samples/sample.glb missing).',
        });
        return;
      }

      const glbKey = `models/${assetId}.glb`;
      await putObjectFromFile(BUCKETS.AR_WEB_ASSETS, glbKey, glb);

      let usdzKey;
      if (usdz) {
        usdzKey = `models/${assetId}.usdz`;
        await putObjectFromFile(BUCKETS.AR_WEB_ASSETS, usdzKey, usdz);
      }

      await notifyCompletion({ jobId, assetId, glbKey, usdzKey });
    } catch (err) {
      console.error(`[mock] job ${jobId} errored:`, err.message);
      await notifyFailure({ jobId, assetId, error: err.message });
    }
  }, config.ai.mockDelayMs);
}
