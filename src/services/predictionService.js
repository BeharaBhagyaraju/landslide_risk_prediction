/**
 * Prediction service — calls the real backend /predict endpoint.
 * Falls back gracefully when the backend is offline so the UI keeps working.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch a landslide risk prediction for the given coordinates.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ riskLevel: string, riskScore: number, lat: number, lng: number, timestamp: string, source: 'api'|'offline' }>}
 */
export const fetchPrediction = async (lat, lng) => {
    try {
        const response = await fetch(
            `${BASE_URL}/predict?lat=${lat}&lng=${lng}`,
            { signal: AbortSignal.timeout(8000) }
        );

        if (!response.ok) throw new Error(`API error ${response.status}`);

        const data = await response.json();
        return {
            ...data,
            lat,
            lng,
            timestamp: new Date().toISOString(),
            source: 'api',
        };
    } catch (err) {
        // Backend is offline or unreachable — return a mock so the UI stays functional
        console.warn('[PredictionService] Backend offline, using mock data:', err.message);
        return {
            riskLevel: 'Unknown',
            riskScore: null,
            lat,
            lng,
            timestamp: new Date().toISOString(),
            source: 'offline',
            error: err.message,
        };
    }
};
