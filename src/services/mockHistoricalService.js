const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory data store for uploaded historical points
let historicalDatabase = [
    { id: 'hist-1', year: 2005, name: 'La Conchita Landslide', lat: 34.36, lng: -119.45, severity: 'Catastrophic', description: 'Major landslide triggered by heavy rainfall.' },
    { id: 'hist-2', year: 2018, name: 'Montecito Mudslides', lat: 34.42, lng: -119.63, severity: 'High', description: 'Debris flows following the Thomas Fire.' },
    { id: 'hist-3', year: 1995, name: 'Pacific Palisades Slide', lat: 34.04, lng: -118.54, severity: 'Moderate', description: 'Coastal bluff failure.' },
];

export const getHistoricalEvents = async () => {
    await delay(300);
    return historicalDatabase;
};

export const setHistoricalEvents = (newEvents) => {
    if (typeof newEvents === 'function') {
        historicalDatabase = newEvents(historicalDatabase);
    } else {
        historicalDatabase = newEvents;
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
    await delay(200);

    // Find the closest event in our database
    let closestEvent = null;
    let minDistance = Infinity;

    historicalDatabase.forEach(event => {
        const dist = getDistance(lat, lng, event.lat, event.lng);
        if (dist < minDistance) {
            minDistance = dist;
            closestEvent = event;
        }
    });

    const threshold = 5; // 5km alert radius

    if (closestEvent && minDistance <= threshold) {
        return {
            isClose: true,
            distance: minDistance.toFixed(2),
            event: `${closestEvent.name} (${closestEvent.year})`,
            source: closestEvent.source || 'Local Database',
            message: `Warning: Location is within ${minDistance.toFixed(2)}km of a known historical landslide site.`
        };
    }

    return {
        isClose: false,
        message: 'No historical landslides recorded within alert radius.'
    };
};
