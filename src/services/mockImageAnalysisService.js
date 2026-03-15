/**
 * Satellite image analysis service.
 *
 * - Calls the real FastAPI backend (/analyze-image) when available.
 * - Falls back to mock data if the backend is offline.
 *
 * Backend expects: POST /analyze-image  (multipart/form-data, field name "file")
 * Model: Tiny Attention U-Net (Landslide4Sense)
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MOCK_RESULT = {
    riskLevel: 'Low',
    confidence: 72,
    landslideAreaPercent: 3.1,
    model: 'LRASPP Model (offline mock)',
    featuresDetected: [
        'Landslide area: 3.1% of image (mock)',
        'LRASPP segmentation (offline)',
        'Slope instability not detected',
    ],
    recommendation: 'Backend offline — connect the FastAPI server to get real predictions.',
    source: 'offline',
};

export const analyzeSatelliteImage = async (fileOrBase64) => {
    try {
        let file = fileOrBase64;

        // If it's a base64 string (from H5 extraction), convert to Blob
        if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) {
            const arr = fileOrBase64.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            file = new Blob([u8arr], { type: mime });
        }

        const formData = new FormData();
        formData.append('file', file, 'satellite.png');

        const response = await fetch(`${BASE_URL}/analyze-image`, {
            method: 'POST',
            body: formData,
            headers: { 'Bypass-Tunnel-Reminder': 'true' },
            signal: AbortSignal.timeout(30_000), // 30s — model inference can be slow
        });

        if (!response.ok) {
            throw new Error(`Server error ${response.status}`);
        }

        const data = await response.json();
        return { ...data, source: 'api' };
    } catch (err) {
        console.warn('[ImageAnalysisService] Backend offline, using mock result:', err.message);
        // Simulate a short processing delay so the UI spinner shows
        await new Promise((r) => setTimeout(r, 1200));
        return { ...MOCK_RESULT };
    }
};

/**
 * Uploads a custom .h5 Keras model to the backend.
 */
export const uploadModel = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/upload-model`, {
            method: 'POST',
            headers: { 'Bypass-Tunnel-Reminder': 'true' },
            body: formData,
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Failed to upload model');
        }

        return await response.json();
    } catch (err) {
        console.error('[ImageAnalysisService] Model upload failed:', err.message);
        throw err;
    }
};
