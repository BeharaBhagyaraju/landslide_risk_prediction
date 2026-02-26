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

export const analyzeSatelliteImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/analyze-image`, {
            method: 'POST',
            body: formData,
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
