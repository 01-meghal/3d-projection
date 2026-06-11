import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

export const ASSET_TYPES = ['direct_3d', 'video_to_3d'];
// Asset lifecycle. Direct uploads jump straight to COMPLETED; video uploads
// move PROCESSING -> COMPLETED (or FAILED) driven by the AI engine + webhook.
export const ASSET_STATUSES = ['UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED'];

const assetSchema = new mongoose.Schema(
  {
    // Public, URL-friendly id used in /view/:assetId and /qr-generator/:assetId.
    publicId: { type: String, default: () => nanoid(12), unique: true, index: true },
    ownerEmail: { type: String, lowercase: true, trim: true },
    type: { type: String, enum: ASSET_TYPES, required: true },
    status: { type: String, enum: ASSET_STATUSES, default: 'UPLOADING' },

    // Final, publicly-served model URLs (mock "ar-web-assets" bucket).
    glbUrl: { type: String },
    usdzUrl: { type: String },

    // Key of the uploaded source video in the private "raw-video-ingest" bucket.
    sourceVideoKey: { type: String },
  },
  { timestamps: true }
);

// The universal AR link is derived from the public id.
assetSchema.virtual('arPath').get(function arPath() {
  return `/view/${this.publicId}`;
});

assetSchema.set('toJSON', { virtuals: true });
assetSchema.set('toObject', { virtuals: true });

export const Asset = mongoose.model('Asset', assetSchema);
