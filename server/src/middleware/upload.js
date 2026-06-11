import multer from 'multer';

// In-memory upload handling; the route then hands the buffer to the storage
// service. Keeps the mock-S3 swap clean (no temp files to manage).

const MB = 1024 * 1024;

const ALLOWED = {
  model: {
    extensions: ['.glb', '.usdz'],
    mimes: ['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream'],
    maxBytes: 50 * MB, // < 50MB per 1-frontend-ui.md
  },
  video: {
    extensions: ['.mp4', '.mov'],
    mimes: ['video/mp4', 'video/quicktime'],
    maxBytes: 500 * MB,
  },
};

function makeFilter(kind) {
  const rule = ALLOWED[kind];
  return (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    const okExt = rule.extensions.some((ext) => lower.endsWith(ext));
    if (!okExt) {
      return cb(new Error(`Invalid file type. Allowed: ${rule.extensions.join(', ')}`));
    }
    cb(null, true);
  };
}

export const uploadModel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ALLOWED.model.maxBytes },
  fileFilter: makeFilter('model'),
}).single('file');

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ALLOWED.video.maxBytes },
  fileFilter: makeFilter('video'),
}).single('file');
