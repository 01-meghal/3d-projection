import axios from 'axios';

// Relative baseURL; Vite proxies /api -> http://localhost:4000 in dev.
const http = axios.create({ baseURL: '/api' });

export async function uploadDirect(file, { email, onProgress } = {}) {
  const form = new FormData();
  form.append('file', file);
  if (email) form.append('email', email);
  const { data } = await http.post('/upload/direct', form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data; // { assetId, status, arPath }
}

export async function uploadVideo(file, { email, onProgress } = {}) {
  const form = new FormData();
  form.append('file', file);
  if (email) form.append('email', email);
  const { data } = await http.post('/upload/video', form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data; // { assetId, status, jobId }
}

export async function getAsset(assetId) {
  const { data } = await http.get(`/assets/${assetId}`);
  return data;
}

export async function getAssetStatus(assetId) {
  const { data } = await http.get(`/assets/${assetId}/status`);
  return data; // { assetId, status }
}
