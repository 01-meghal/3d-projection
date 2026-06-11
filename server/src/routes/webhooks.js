import { Router } from 'express';
import { Asset } from '../models/Asset.js';
import { AiJob } from '../models/AiJob.js';
import { publicUrl } from '../services/storage.js';

const router = Router();

// POST /api/webhooks/ai-completion — callback from the AI engine (5-ai-processing.md).
// Updates the AiJob and, on success, attaches the generated model URLs to the Asset.
router.post('/ai-completion', async (req, res, next) => {
  try {
    const { jobId, assetId, status, glbKey, usdzKey, error } = req.body || {};

    if (!jobId || !assetId || !status) {
      return res.status(400).json({ error: 'jobId, assetId and status are required.' });
    }

    const job = await AiJob.findById(jobId);
    const asset = await Asset.findOne({ publicId: assetId });
    if (!job || !asset) {
      return res.status(404).json({ error: 'Job or asset not found.' });
    }

    if (status === 'COMPLETED') {
      if (glbKey) asset.glbUrl = publicUrl(glbKey);
      if (usdzKey) asset.usdzUrl = publicUrl(usdzKey);
      asset.status = 'COMPLETED';
      job.status = 'COMPLETED';
      job.error = undefined;

      // Stubbed notification (1-frontend-ui.md: "we will email you when ready").
      if (asset.ownerEmail) {
        console.log(`[email] (stub) notifying ${asset.ownerEmail}: asset ${asset.publicId} is ready.`);
      }
    } else {
      asset.status = 'FAILED';
      job.status = 'FAILED';
      job.error = error || 'Unknown processing error.';
      console.log(`[ai] asset ${asset.publicId} failed: ${job.error}`);
    }

    await Promise.all([asset.save(), job.save()]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
