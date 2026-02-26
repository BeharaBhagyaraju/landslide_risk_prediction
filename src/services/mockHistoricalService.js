const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Note: we still keep a bit of fallback logic if needed, 
// but primarily we use the database.
let cachedHistoricalEvents = [];

export const getHistoricalEvents = async () => {
    try {
        const response = await fetch(`${BASE_URL}/historical-events`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        cachedHistoricalEvents = data;
        return data;
    } catch (err) {
        console.warn('[HistoricalService] Backend offline, using cache:', err.message);
        return cachedHistoricalEvents;
    }
};

export const setHistoricalEvents = async (newEvents) => {
    // If it's a functional update (like in Events.jsx), we might need to handle it differently
    // but for CSV uploads, we get an array.
    let eventsToSave = [];
    if (typeof newEvents === 'function') {
        eventsToSave = newEvents(cachedHistoricalEvents);
    } else {
        eventsToSave = newEvents;
    }

    try {
        const response = await fetch(`${BASE_URL}/historical-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventsToSave),
        });
        if (!response.ok) throw new Error('Failed to save to database');
        const result = await response.json();
        cachedHistoricalEvents = eventsToSave;
        return result;
    } catch (err) {
        console.error('[HistoricalService] Could not save to backend:', err.message);
        cachedHistoricalEvents = eventsToSave; // Update local cache anyway
        return { status: 'offline', count: eventsToSave.length };
    }
};

// Haversine formula for distance calculation in km
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const checkHistoricalProximity = async (lat, lng) => {
    // Ensure we have data
    const events = cachedHistoricalEvents.length > 0 ? cachedHistoricalEvents : await getHistoricalEvents();

    // Find the closest event in our database
    let closestEvent = null;
    let minDistance = Infinity;

    events.forEach(event => {
        const dist = getDistance(lat, lng, event.lat, event.lng);
        if (dist < minDistance) {
            minDistance = dist;
            closestEvent = event;
        }
    });

    const threshold = 100; // Expanded to 100km for risk influence
    const alertThreshold = 5; // 5km for severe warning

    if (closestEvent && minDistance <= threshold) {
        // Calculate influence factor (0.0 to 1.0)
        // 1.0 at < 5km, scales down to 0 at 100km
        const impactFactor = Math.max(0, 1 - (minDistance / threshold));

        return {
            isClose: true,
            distance: minDistance.toFixed(2),
            event: `${closestEvent.name} (${closestEvent.year})`,
            source: closestEvent.source || 'Database',
            impactFactor: parseFloat(impactFactor.toFixed(2)),
            closestLat: closestEvent.lat,
            closestLng: closestEvent.lng,
            message: minDistance <= alertThreshold
                ? `CRITICAL: Within ${minDistance.toFixed(2)}km of a known historical site.`
                : `Nearby History: Known landslide record within ${minDistance.toFixed(2)}km (Influencing risk assessment).`
        };
    }

    return {
        isClose: false,
        impactFactor: 0,
        message: 'No significant historical landslides within 100km.'
    };
};
