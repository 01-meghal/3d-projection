# 1. Frontend User Interface (UI)

The frontend is the face of the application, built using React.js (or Next.js for better SEO and server-side rendering). It handles user interactions, file validations, and renders the 3D Viewer.

🔗 Connected Modules
Data goes to: Backend API

Assets served from: Cloud Storage

Core Screens & Components
1. The Upload Dashboard (/dashboard)
This is the main entry point where the user selects their upload path.

Component State
JavaScript
const [uploadMode, setUploadMode] = useState('direct_3d'); // 'direct_3d' | 'video_to_3d'
const [uploadProgress, setUploadProgress] = useState(0);
const [jobStatus, setJobStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'completed'

Path A: Direct 3D Upload (Instant)
Inputs: Accepts .glb and .usdz files.

Validation: Checks file size (e.g., < 50MB) before uploading.

UX: Shows an instant loading bar. Upon 100%, immediately redirects to the QR Code Generation screen.

Path B: Video Upload (Async Processing)
Inputs: Accepts .mp4, .mov.

Validation: Enforces maximum video length (e.g., 60 seconds) to prevent massive API costs on the AI Processing Engine.

UX:
1. Shows video upload progress.
2. Once uploaded to our Backend API, transitions to a "Processing" state.
3. Uses WebSockets or Long Polling to listen for updates from the database.
4. Warns the user: "This process takes 5-15 minutes. You can safely close this page; we will email you when it is ready."

2. The QR Generation Screen (/qr-generator/:assetId)
Once the Database marks an asset as COMPLETED, this screen activates.

Function: Fetches the universal AR link from the backend.

Display: Uses qrcode.react to render a high-error-correction QR code.

Customization: Allows the user to upload a center logo overlay.

3. The Universal AR Viewer (/view/:assetId)
This is the mobile-optimized screen that opens when the QR code is scanned.

Must implement <model-viewer> with src pointing to the .glb and ios-src pointing to the .usdz.

Must hide all UI elements except the "View in your room" AR trigger button.

Next Step
Understand how the frontend communicates with the server: ➡️ 2. Backend API
