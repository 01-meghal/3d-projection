# 2. Backend API & Routing

The Backend serves as the traffic controller for the entire platform. Built with Node.js and Express, it handles security, routing, and orchestrates the complex async tasks required for video processing.

🔗 Connected Modules
Receives requests from: Frontend UI

Saves files to: Cloud Storage

Stores state in: Database

Triggers: AI Processing

Core API Routes

POST /api/upload/direct
Handles standard 3D file uploads.

POST /api/upload/video
Handles the initial video ingestion for photogrammetry.

POST /api/webhooks/ai-completion
Handles AI completion callbacks and updates asset status.

Security Considerations
- Rate Limiting
- CORS Protection

Next Step
Learn where these massive files are actually stored: ➡️ 3. Cloud Storage
