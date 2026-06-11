import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Listen on all interfaces so a phone on the same Wi-Fi can reach the
    // dev server via the machine's LAN IP (needed for QR scanning).
    host: true,
    allowedHosts: true,
    proxy: {
      // Proxy API + served assets to the Express backend during dev.
      // Because the phone hits these through the Vite origin, model/API
      // requests stay same-origin (no CORS, no localhost references).
      '/api': 'http://localhost:4000',
      '/assets': 'http://localhost:4000',
    },
  },
});
