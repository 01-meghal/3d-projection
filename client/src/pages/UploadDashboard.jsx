import { useState } from 'react';
import DirectUpload from '../components/DirectUpload.jsx';
import VideoUpload from '../components/VideoUpload.jsx';

// /dashboard — main entry point; user selects their upload path.
export default function UploadDashboard() {
  const [uploadMode, setUploadMode] = useState('direct_3d'); // 'direct_3d' | 'video_to_3d'

  return (
    <div className="dashboard">
      <h1>Upload your model</h1>

      <div className="tabs">
        <button
          className={uploadMode === 'direct_3d' ? 'tab tab--active' : 'tab'}
          onClick={() => setUploadMode('direct_3d')}
        >
          Direct 3D (instant)
        </button>
        <button
          className={uploadMode === 'video_to_3d' ? 'tab tab--active' : 'tab'}
          onClick={() => setUploadMode('video_to_3d')}
        >
          Video → 3D
        </button>
      </div>

      {uploadMode === 'direct_3d' ? <DirectUpload /> : <VideoUpload />}
    </div>
  );
}
