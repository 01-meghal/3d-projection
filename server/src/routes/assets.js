import { Router } from 'express';
import { Asset } from '../models/Asset.js';

const router = Router();

function serializeAsset(asset) {
  return {
    assetId: asset.publicId,
    type: asset.type,
    status: asset.status,
    glbUrl: asset.glbUrl || null,
    usdzUrl: asset.usdzUrl || null,
    arPath: asset.arPath,
    createdAt: asset.createdAt,
  };
}

// GET /api/assets/:assetId — full asset (QR + viewer screens).
router.get('/:assetId', async (req, res, next) => {
  try {
    const asset = await Asset.findOne({ publicId: req.params.assetId });
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });
    res.json(serializeAsset(asset));
  } catch (err) {
    next(err);
  }
});

// GET /api/assets/:assetId/status — lightweight status for the polling hook.
router.get('/:assetId/status', async (req, res, next) => {
  try {
    const asset = await Asset.findOne({ publicId: req.params.assetId }).select('publicId status');
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });
    res.json({ assetId: asset.publicId, status: asset.status });
  } catch (err) {
    next(err);
  }
});

export default router;
