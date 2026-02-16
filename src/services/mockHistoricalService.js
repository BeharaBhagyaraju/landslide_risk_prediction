const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getHistoricalEvents = async () => {
    await delay(700);
    return [
        { id: 'hist-1', year: 2005, name: 'La Conchita Landslide', lat: 34.36, lng: -119.45, severity: 'Catastrophic', description: 'Major landslide triggered by heavy rainfall.' },
        { id: 'hist-2', year: 2018, name: 'Montecito Mudslides', lat: 34.42, lng: -119.63, severity: 'High', description: 'Debris flows following the Thomas Fire.' },
        { id: 'hist-3', year: 1995, name: 'Pacific Palisades Slide', lat: 34.04, lng: -118.54, severity: 'Moderate', description: 'Coastal bluff failure.' },
    ];
};

export const checkHistoricalProximity = async (lat, lng) => {
    await delay(400);
    // Simple mock logic: if latitude is > 34.2, say it's close to a historical site
    if (lat > 34.2) {
        return {
            isClose: true,
            distance: 2.5, // km
            event: 'La Conchita Landslide (2005)',
            message: 'Warning: Location is within 2.5km of a known historical landslide site.'
        };
    }
    return {
        isClose: false,
        message: 'No historical landslides recorded within alert radius.'
    };
};
