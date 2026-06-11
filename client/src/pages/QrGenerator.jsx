import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getAsset } from '../api/client.js';

// /qr-generator/:assetId — renders a high-error-correction QR for the AR link,
// with an optional center logo overlay (1-frontend-ui.md).
export default function QrGenerator() {
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(null);
  const [logo, setLogo] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getAsset(assetId)
      .then((data) => !cancelled && setAsset(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.error || err.message));
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  function onLogo(e) {
    const file = e.target.files?.[0];
    if (file) setLogo(URL.createObjectURL(file));
  }

  function download() {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ar-qr-${assetId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  if (error) return <p className="error">{error}</p>;
  if (!asset) return <p className="muted">Loading…</p>;

  // The universal AR link the QR points to (absolute, scannable from a phone).
  const arUrl = `${window.location.origin}${asset.arPath}`;

  return (
    <div className="qr">
      <h1>Your AR QR code</h1>
      <p className="muted">Scan to view in AR, or open the link below.</p>

      <div className="qr__canvas" ref={canvasRef}>
        <QRCodeCanvas
          value={arUrl}
          size={256}
          level="H" // high error correction (allows a center logo)
          includeMargin
          imageSettings={
            logo
              ? { src: logo, height: 56, width: 56, excavate: true }
              : undefined
          }
        />
      </div>

      <p className="qr__link">
        <a href={asset.arPath} target="_blank" rel="noreferrer">
          {arUrl}
        </a>
      </p>

      <div className="qr__actions">
        <label className="filebtn filebtn--sm">
          Add center logo
          <input type="file" accept="image/*" onChange={onLogo} hidden />
        </label>
        <button className="btn" onClick={download}>
          Download PNG
        </button>
      </div>
    </div>
  );
}
