import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

const toFloat = (value, fallback) => {
  const n = Number.parseFloat(value ?? '');
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  port: toInt(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ar_platform',
  publicAssetBaseUrl: process.env.PUBLIC_ASSET_BASE_URL || '/assets',
  selfBaseUrl: process.env.SELF_BASE_URL || 'http://localhost:4000',
  ai: {
    mockDelayMs: toInt(process.env.AI_MOCK_DELAY_MS, 8000),
    mockFailureRate: toFloat(process.env.AI_MOCK_FAILURE_RATE, 0),
  },
  photogrammetry: {
    // 'mock' = local stub (default). 'kiri' = real KIRI Engine API.
    // Falls back to 'mock' at runtime if 'kiri' is selected but no key is set.
    provider: process.env.PHOTOGRAMMETRY_PROVIDER || 'mock',
    kiri: {
      apiKey: process.env.KIRI_API_KEY || '',
      baseUrl: process.env.KIRI_BASE_URL || 'https://api.kiriengine.app/api',
      // Output + quality knobs (see docs.kiriengine.app). glb keeps textures embedded.
      fileFormat: process.env.KIRI_FILE_FORMAT || 'glb',
      modelQuality: toInt(process.env.KIRI_MODEL_QUALITY, 1), // 0 High,1 Medium,2 Low,3 Ultra
      textureQuality: toInt(process.env.KIRI_TEXTURE_QUALITY, 1), // 0 4K,1 2K,2 1K,3 8K
      // Polling: KIRI jobs take minutes. Check every interval up to a max window.
      pollIntervalMs: toInt(process.env.KIRI_POLL_INTERVAL_MS, 15000),
      maxPollMs: toInt(process.env.KIRI_MAX_POLL_MS, 20 * 60 * 1000),
    },
  },
};
