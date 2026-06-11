import { config } from '../../config/env.js';

// Both providers report results by calling our own /api/webhooks/ai-completion
// endpoint, so the completion logic (updating Asset + AiJob) lives in exactly
// one place. A real provider with its own webhook would hit that same route.

async function postWebhook(payload) {
  const url = `${config.selfBaseUrl}/api/webhooks/ai-completion`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error(`[photogrammetry] webhook responded ${res.status}`);
  } catch (err) {
    console.error('[photogrammetry] failed to call completion webhook:', err.message);
  }
}

export function notifyCompletion({ jobId, assetId, glbKey, usdzKey }) {
  return postWebhook({ jobId, assetId, status: 'COMPLETED', glbKey, usdzKey });
}

export function notifyFailure({ jobId, assetId, error }) {
  return postWebhook({ jobId, assetId, status: 'FAILED', error });
}
