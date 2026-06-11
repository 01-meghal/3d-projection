import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { config } from '../../config/env.js';
import { AiJob } from '../../models/AiJob.js';
import { BUCKETS, putObject, getObjectPath } from '../storage.js';
import { notifyCompletion, notifyFailure } from './notify.js';

// ---------------------------------------------------------------------------
// Real photogrammetry provider: KIRI Engine Open API.
// Docs: https://docs.kiriengine.app  (spec: KIRIENGINE API Instruction)
//
// Flow: upload the stored source video -> get a `serialize` task id ->
// poll getStatus -> on success download the model zip -> extract the .glb ->
// store it in the public bucket -> report completion via our internal webhook.
//
// We upload the video BYTES directly, so KIRI never needs to reach our
// (local/mock) storage — no public tunnel required.
// ---------------------------------------------------------------------------

const k = config.photogrammetry.kiri;

// KIRI getStatus codes.
const STATUS = { UPLOADING: -1, PROCESSING: 0, FAILED: 1, SUCCESS: 2, QUEUING: 3, EXPORTED: 4 };

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${k.apiKey}`, ...extra };
}

// KIRI wraps payloads as { code, msg, data, ok }. Be tolerant of either shape.
async function parse(res) {
  const body = await res.json();
  if (body && typeof body === 'object' && 'data' in body) return body.data ?? body;
  return body;
}

async function submitVideo(videoPath) {
  const buffer = await fs.readFile(videoPath);
  const form = new FormData();
  form.append('videoFile', new Blob([buffer]), path.basename(videoPath));
  form.append('fileFormat', k.fileFormat);
  form.append('modelQuality', String(k.modelQuality));
  form.append('textureQuality', String(k.textureQuality));
  form.append('isMask', '0');
  form.append('textureSmoothing', '0');

  const res = await fetch(`${k.baseUrl}/v1/open/photo/video`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`KIRI submit failed: HTTP ${res.status} ${await res.text()}`);
  const data = await parse(res);
  const serialize = data.serialize || data.serializ || data.serial;
  if (!serialize) throw new Error(`KIRI submit returned no serialize: ${JSON.stringify(data)}`);
  return serialize;
}

async function getStatus(serialize) {
  const res = await fetch(
    `${k.baseUrl}/v1/open/model/getStatus?serialize=${encodeURIComponent(serialize)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`KIRI getStatus failed: HTTP ${res.status}`);
  const data = await parse(res);
  return typeof data.status === 'number' ? data.status : Number(data.status);
}

async function getModelUrl(serialize) {
  const res = await fetch(
    `${k.baseUrl}/v1/open/model/getModelZip?serialize=${encodeURIComponent(serialize)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`KIRI getModelZip failed: HTTP ${res.status}`);
  const data = await parse(res);
  if (!data.modelUrl) throw new Error(`KIRI getModelZip returned no modelUrl: ${JSON.stringify(data)}`);
  return data.modelUrl;
}

// Download the result zip and pull out the first .glb entry.
async function downloadGlbFromZip(modelUrl) {
  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(`KIRI model download failed: HTTP ${res.status}`);
  const zipBuffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(zipBuffer);
  const entry = zip.getEntries().find((e) => !e.isDirectory && e.entryName.toLowerCase().endsWith('.glb'));
  if (!entry) throw new Error('No .glb found in KIRI model zip.');
  return entry.getData();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function startKiriJob({ assetId, jobId, sourceVideoKey }) {
  console.log(`[kiri] job ${jobId} starting for asset ${assetId}`);

  // Fire-and-forget async driver; reports back via the internal webhook.
  (async () => {
    try {
      await AiJob.findByIdAndUpdate(jobId, { status: 'PROCESSING' });

      const videoPath = getObjectPath(BUCKETS.RAW_VIDEO_INGEST, sourceVideoKey);
      const serialize = await submitVideo(videoPath);
      await AiJob.findByIdAndUpdate(jobId, { providerJobId: serialize });
      console.log(`[kiri] job ${jobId} submitted, serialize=${serialize}`);

      const deadline = Date.now() + k.maxPollMs;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (Date.now() > deadline) throw new Error('KIRI job timed out.');
        await sleep(k.pollIntervalMs);

        const status = await getStatus(serialize);
        if (status === STATUS.FAILED) throw new Error('KIRI reported FAILED.');
        if (status === STATUS.SUCCESS || status === STATUS.EXPORTED) break;
        console.log(`[kiri] job ${jobId} status=${status} (waiting)`);
      }

      const modelUrl = await getModelUrl(serialize);
      const glb = await downloadGlbFromZip(modelUrl);
      const glbKey = `models/${assetId}.glb`;
      await putObject(BUCKETS.AR_WEB_ASSETS, glbKey, glb);

      console.log(`[kiri] job ${jobId} completed; stored ${glbKey}`);
      await notifyCompletion({ jobId, assetId, glbKey });
    } catch (err) {
      console.error(`[kiri] job ${jobId} errored:`, err.message);
      await notifyFailure({ jobId, assetId, error: err.message });
    }
  })();
}
