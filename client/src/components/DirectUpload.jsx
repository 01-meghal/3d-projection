import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDirect } from '../api/client.js';
import ProgressBar from './ProgressBar.jsx';

const MAX_BYTES = 50 * 1024 * 1024; // < 50MB per docs
const ACCEPT = '.glb,.usdz';

// Path A: Direct 3D Upload (instant). 1-frontend-ui.md.
export default function DirectUpload() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | error
  const [error, setError] = useState(null);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.glb') && !lower.endsWith('.usdz')) {
      setError('Please choose a .glb or .usdz file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File is too large (max 50MB).');
      return;
    }

    try {
      setStatus('uploading');
      setProgress(0);
      const res = await uploadDirect(file, { onProgress: setProgress });
      // On 100% -> immediately redirect to the QR generation screen.
      navigate(`/qr-generator/${res.assetId}`);
    } catch (err) {
      setStatus('error');
      setError(err?.response?.data?.error || err.message);
    }
  }

  return (
    <div className="card">
      <h2>Direct 3D Upload</h2>
      <p className="muted">Accepts .glb and .usdz · max 50MB · instant</p>

      <label className="filebtn">
        {status === 'uploading' ? 'Uploading…' : 'Choose 3D file'}
        <input
          type="file"
          accept={ACCEPT}
          onChange={onFile}
          disabled={status === 'uploading'}
          hidden
        />
      </label>

      {status === 'uploading' && <ProgressBar value={progress} label="Uploading" />}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
