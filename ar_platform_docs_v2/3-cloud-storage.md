# 3. Cloud Storage (AWS S3)

Handling 3D models and 4K videos requires robust storage.

Bucket 1: raw-video-ingest (PRIVATE)
Purpose: Stores uploaded videos securely.

Bucket 2: ar-web-assets (PUBLIC)
Purpose: Stores final .glb, .usdz, and QR assets.

Advanced Optimization: Pre-signed URLs
Frontend uploads directly to S3 using temporary secure URLs.

Next Step
Discover how we keep track of all these URLs and user files: ➡️ 4. Database & Schema
