import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';

// ---------------------------------------------------------------------------
// Mock AWS S3 (see 3-cloud-storage.md).
//
// Two "buckets" backed by local directories:
//   - raw-video-ingest  (PRIVATE) — uploaded source videos
//   - ar-web-assets     (PUBLIC)  — final .glb / .usdz / QR assets
//
// The interface (putObject / getObjectPath / getPresignedUrl / publicUrl)
// mirrors how you'd use the real S3 SDK, so it can be swapped in later.
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.resolve(__dirname, '../../storage');

export const BUCKETS = {
  RAW_VIDEO_INGEST: 'raw-video-ingest',
  AR_WEB_ASSETS: 'ar-web-assets',
};

function bucketDir(bucket) {
  return path.join(STORAGE_ROOT, bucket);
}

export async function ensureStorage() {
  await fs.mkdir(bucketDir(BUCKETS.RAW_VIDEO_INGEST), { recursive: true });
  await fs.mkdir(bucketDir(BUCKETS.AR_WEB_ASSETS), { recursive: true });
}

/** Write a buffer to a bucket under `key`. Returns the key. */
export async function putObject(bucket, key, buffer) {
  const dest = path.join(bucketDir(bucket), key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
  return key;
}

/** Copy a file from disk into a bucket under `key`. Returns the key. */
export async function putObjectFromFile(bucket, key, srcPath) {
  const dest = path.join(bucketDir(bucket), key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(srcPath, dest);
  return key;
}

/** Absolute path to an object on disk (used to serve the public bucket). */
export function getObjectPath(bucket, key) {
  return path.join(bucketDir(bucket), key);
}

/** Absolute directory for a bucket (used by express static middleware). */
export function getBucketDir(bucket) {
  return bucketDir(bucket);
}

/**
 * Public URL for an object in the PUBLIC bucket.
 *
 * Returns a HOST-RELATIVE path (e.g. "/assets/models/abc.glb") by default so
 * the URL works from any origin the frontend is served on — including a phone
 * hitting the dev server via its LAN IP, where requests are proxied to the
 * backend and "localhost" would be wrong. Set PUBLIC_ASSET_BASE_URL to an
 * absolute URL (CDN / real S3) for production.
 * (Real S3 would be the bucket's public/CDN URL.)
 */
export function publicUrl(key) {
  return `${config.publicAssetBaseUrl}/${key}`;
}

/**
 * Mock pre-signed URL (see 3-cloud-storage.md "Pre-signed URLs").
 * In this skeleton we return a plain local URL; the shape matches what the
 * frontend would receive from a real presign call.
 */
export function getPresignedUrl(bucket, key) {
  return {
    bucket,
    key,
    url: publicUrl(key),
    // A real presign would include an expiry + signature; left as a stub.
    expiresIn: 900,
  };
}
