import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo } from '../api/client.js';
import { useJobStatus } from '../hooks/useJobStatus.js';
import ProgressBar from './ProgressBar.jsx';

const MAX_SECONDS = 60; // enforce max length to cap AI cost (1-frontend-ui.md)

// Read a video file's duration in the browser before uploading.
function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata.'));
    };
    video.src = url;
  });
}

// Path B: Video Upload (async processing). 1-frontend-ui.md.
export default function VideoUpload() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | uploading | processing | error
  const [error, setError] = useState(null);
  const [assetId, setAssetId] = useState(null);

  // Once uploaded, poll for completion.
  const { status } = useJobStatus(assetId, { enabled: phase === 'processing' });

  // Redirect to the QR screen once processing completes. Must run in an effect
  // (not during render) or react-router's navigate() can silently no-op,
  // leaving the user stuck on "Processing…".
  useEffect(() => {
    if (status === 'COMPLETED' && assetId) {
      navigate(`/qr-generator/${assetId}`);
    }
  }, [status, assetId, navigate]);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.mp4') && !lower.endsWith('.mov')) {
      setError('Please choose an .mp4 or .mov file.');
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_SECONDS) {
        setError(`Video is too long (${Math.round(duration)}s). Max ${MAX_SECONDS}s.`);
        return;
      }
    } catch {
      // If metadata can't be read, let the server be the gate; continue.
    }

    try {
      setPhase('uploading');
      setProgress(0);
      const res = await uploadVideo(file, { onProgress: setProgress });
      setAssetId(res.assetId);
      setPhase('processing');
    } catch (err) {
      setPhase('error');
      const apiErr = err?.response?.data?.error;
      setError(typeof apiErr === 'string' ? apiErr : (apiErr?.message || err.message || 'An error occurred'));
    }
  }

  return (
    <div className="card">
      <h2>Video → 3D</h2>
      <p className="muted">Accepts .mp4 and .mov · max {MAX_SECONDS}s · AI photogrammetry</p>

      {phase !== 'processing' && (
        <label className="filebtn">
          {phase === 'uploading' ? 'Uploading…' : 'Choose video'}
          <input
            type="file"
            accept=".mp4,.mov"
            onChange={onFile}
            disabled={phase === 'uploading'}
            hidden
          />
        </label>
      )}

      {phase === 'uploading' && <ProgressBar value={progress} label="Uploading" />}

      {phase === 'processing' && (
        <div className="processing">
          <div className="spinner" />
          <p>
            <strong>Processing…</strong> {status === 'FAILED' ? 'Something went wrong.' : ''}
          </p>
          <p className="muted">
            This process takes 5–15 minutes. You can safely close this page; we will
            email you when it is ready.
          </p>
          {status === 'FAILED' && (
            <p className="error">Processing failed. Please try a different video.</p>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
