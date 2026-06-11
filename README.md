# AR Platform

Upload a 3D model (`.glb`/`.usdz`) **or** a video that gets converted to 3D via photogrammetry, then generate a QR code that opens a mobile AR viewer.

This repository is a **runnable local skeleton** that mirrors the architecture in [`ar_platform_docs_v2/`](ar_platform_docs_v2/README.md). The two external dependencies — **AWS S3** and the **AI photogrammetry engine** — are **mocked locally**, so the whole flow runs end-to-end on a dev machine with no cloud accounts or credentials.

## Stack

| Layer    | Tech                         |
| -------- | ---------------------------- |
| Frontend | React + Vite SPA             |
| Backend  | Node.js + Express            |
| Database | MongoDB + Mongoose           |
| Storage  | Local filesystem (mock S3)   |
| AI       | Local stub (mock webhook)    |

## Project layout

```
.
├── ar_platform_docs_v2/   Architecture docs (source of truth)
├── client/                React + Vite frontend
├── server/                Express + Mongoose backend
└── package.json           npm workspaces + dev orchestration
```

## Prerequisites

- **Node.js** >= 18
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`
  - Native install, or via the bundled compose file:
    ```bash
    docker compose up -d        # starts mongo:7 on :27017 (data persisted in a volume)
    ```

## Setup & run

```bash
# 1. Install all workspace dependencies (from repo root)
npm install

# 2. Create the server env file from the example
cp server/.env.example server/.env      # PowerShell: copy server\.env.example server\.env

# 3. Start MongoDB (see Prerequisites)

# 4. Start both apps (Express API + Vite dev server)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

Run individually with `npm run dev:server` or `npm run dev:client`.

## Walking the flow

1. Open the **Upload Dashboard** at http://localhost:5173/dashboard
2. **Path A — Direct 3D:** upload a `.glb`/`.usdz` (< 50MB) → redirected to the QR screen → open the AR viewer link.
3. **Path B — Video → 3D:** upload an `.mp4`/`.mov` → "Processing" state → the mock AI engine emits a sample model after a short delay and fires the completion webhook → QR screen → AR viewer.

## Where the mocks live

- **Mock S3** — [`server/src/services/storage.js`](server/src/services/storage.js). Files land in `server/storage/` (gitignored): `raw-video-ingest/` (private) and `ar-web-assets/` (public, served statically). Swap in the real AWS SDK behind the same `putObject` / `getPresignedUrl` interface.
- **Photogrammetry** — [`server/src/services/photogrammetry/`](server/src/services/photogrammetry/). A provider abstraction:
  - `mock.js` (default) — emits the bundled sample model after a short delay.
  - `kiri.js` — real **KIRI Engine** API: uploads the video, polls, downloads the result zip, extracts the `.glb`.
  - Both report completion via the same internal `/api/webhooks/ai-completion` route.

## Using real photogrammetry (KIRI Engine)

The mock returns the same sample model for every video. To get a real 3D reconstruction of your actual video:

1. Create a **KIRI Engine Developer** account and API key — https://docs.kiriengine.app (paid; limited free starter credits).
2. In `server/.env`, set:
   ```ini
   PHOTOGRAMMETRY_PROVIDER=kiri
   KIRI_API_KEY=your_key_here
   ```
3. Restart the server. On boot it logs `[photogrammetry] provider: kiri`.

The integration uploads the video bytes **directly** to KIRI, so no public URL/tunnel is needed. KIRI jobs take several minutes; quality/format knobs (`KIRI_MODEL_QUALITY`, `KIRI_TEXTURE_QUALITY`, etc.) are in `.env.example`. If `PHOTOGRAMMETRY_PROVIDER=kiri` but the key is empty, it safely falls back to the mock.

## Notes / scope

- Auth and email are stubbed (email = console log). The `User` model exists for schema fidelity.
- Video status uses **long polling** (the docs permit WebSockets or polling).
- See `server/src/assets/samples/README.md` for the placeholder model the mock engine emits.
