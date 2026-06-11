import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '@google/model-viewer'; // registers the <model-viewer> custom element
import { getAsset } from '../api/client.js';

// /view/:assetId — mobile-optimized AR viewer opened when the QR is scanned.
// All UI hidden except the "View in your room" AR trigger (1-frontend-ui.md).
export default function ArViewer() {
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAsset(assetId)
      .then((data) => !cancelled && setAsset(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.error || err.message));
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (error) return <div className="viewer viewer--msg">{error}</div>;
  if (!asset) return <div className="viewer viewer--msg">Loading…</div>;
  if (asset.status !== 'COMPLETED' || !asset.glbUrl) {
    return <div className="viewer viewer--msg">This model isn’t ready yet.</div>;
  }

  return (
    <div className="viewer">
      {/* model-viewer is a web component; React passes attributes through. */}
      <model-viewer
        src={asset.glbUrl}
        ios-src={asset.usdzUrl || undefined}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        style={{ width: '100%', height: '100%' }}
      >
        <button slot="ar-button" className="ar-button">
          View in your room
        </button>
      </model-viewer>
    </div>
  );
}
