import { Routes, Route, Navigate, Link } from 'react-router-dom';
import UploadDashboard from './pages/UploadDashboard.jsx';
import QrGenerator from './pages/QrGenerator.jsx';
import ArViewer from './pages/ArViewer.jsx';

export default function App() {
  return (
    <Routes>
      {/* The AR viewer is intentionally chrome-free (mobile, scanned via QR). */}
      <Route path="/view/:assetId" element={<ArViewer />} />

      {/* App screens share a simple header. */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<UploadDashboard />} />
        <Route path="/qr-generator/:assetId" element={<QrGenerator />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import { Outlet } from 'react-router-dom';

function AppShell() {
  return (
    <div className="shell">
      <header className="shell__header">
        <Link to="/dashboard" className="shell__brand">
          AR Platform
        </Link>
      </header>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  );
}
