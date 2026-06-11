import mongoose from 'mongoose';

// Status values exactly as listed in 4-database-schema.md.
export const AI_JOB_STATUSES = ['UPLOADING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'];

const aiJobSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    status: { type: String, enum: AI_JOB_STATUSES, default: 'QUEUED' },
    // External provider's task id (e.g. KIRI `serialize`); empty for the mock.
    providerJobId: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

export const AiJob = mongoose.model('AiJob', aiJobSchema);
