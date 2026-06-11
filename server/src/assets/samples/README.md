# Sample models for the mock AI engine

The mock photogrammetry engine ([`../../services/aiEngine.js`](../../services/aiEngine.js))
"generates" a 3D model for video uploads by copying a bundled sample from this
folder into the public bucket.

Drop a model file here named **`sample.glb`** (and optionally `sample.usdz` for
iOS Quick Look). Any small `.glb` works. Good public sources:

- Khronos glTF Sample Assets — e.g. the classic Damaged Helmet or a small `Box.glb`
  https://github.com/KhronosGroup/glTF-Sample-Assets
- `<model-viewer>` examples — `Astronaut.glb`
  https://modelviewer.dev/shared-assets/models/Astronaut.glb

Example (PowerShell):

```powershell
Invoke-WebRequest `
  -Uri "https://modelviewer.dev/shared-assets/models/Astronaut.glb" `
  -OutFile "sample.glb"
```

If `sample.glb` is missing, video jobs will resolve to **FAILED** with a clear
message — the rest of the app still runs, and direct `.glb`/`.usdz` uploads
(Path A) are unaffected.
