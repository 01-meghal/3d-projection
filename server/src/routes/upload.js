import { Router } from 'express';
import path from 'node:path';
import { uploadModel, uploadVideo } from '../middleware/upload.js';
import { Asset } from '../models/Asset.js';
import { AiJob } from '../models/AiJob.js';
import { BUCKETS, putObject, publicUrl } from '../services/storage.js';
import { startPhotogrammetryJob } from '../services/photogrammetry/index.js';

const router = Router();

// Wrap a multer middleware so its errors become clean 400s instead of 500s.
function runUpload(mw) {
  return (req, res, next) =>
    mw(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file provided (field "file").' });
      next();
    });
}

// POST /api/upload/direct — standard 3D file upload (Path A). Instant.
router.post('/direct', runUpload(uploadModel), async (req, res, next) => {
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const ownerEmail = req.body.email;

    const asset = await Asset.create({ type: 'direct_3d', status: 'UPLOADING', ownerEmail });

    const key = `models/${asset.publicId}${ext}`;
    await putObject(BUCKETS.AR_WEB_ASSETS, key, req.file.buffer);

    if (ext === '.usdz') asset.usdzUrl = publicUrl(key);
    else asset.glbUrl = publicUrl(key);
    asset.status = 'COMPLETED';
    await asset.save();

    res.status(201).json({
      assetId: asset.publicId,
      status: asset.status,
      arPath: asset.arPath,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/video — initial video ingestion for photogrammetry (Path B).
router.post('/video', runUpload(uploadVideo), async (req, res, next) => {
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const ownerEmail = req.body.email;

    const asset = await Asset.create({ type: 'video_to_3d', status: 'UPLOADING', ownerEmail });

    // Store source video in the PRIVATE bucket.
    const videoKey = `videos/${asset.publicId}${ext}`;
    await putObject(BUCKETS.RAW_VIDEO_INGEST, videoKey, req.file.buffer);

    asset.sourceVideoKey = videoKey;
    asset.status = 'PROCESSING';
    await asset.save();

    const job = await AiJob.create({ asset: asset._id, status: 'QUEUED' });

    // Trigger photogrammetry (mock or real provider); it reports back via the webhook.
    startPhotogrammetryJob({
      assetId: asset.publicId,
      jobId: job._id.toString(),
      sourceVideoKey: asset.sourceVideoKey,
    });

    res.status(202).json({
      assetId: asset.publicId,
      status: asset.status,
      jobId: job._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
