const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const searchLocations = async (query) => {
    await delay(300);
    if (!query) return [];

    // Simulate search results
    return [
        { id: 'loc-1', name: 'Santa Monica Mountains, CA', lat: 34.1, lng: -118.5 },
        { id: 'loc-2', name: 'Rancho Palos Verdes, CA', lat: 33.74, lng: -118.35 },
        { id: 'loc-3', name: 'La Conchita, CA', lat: 34.36, lng: -119.45 },
    ].filter(l => l.name.toLowerCase().includes(query.toLowerCase()));
};

export const getCurrentLocation = () => {
    return new Promise((resolve) => {
        // Mock geolocation
        setTimeout(() => {
            resolve({ lat: 34.05, lng: -118.25 });
        }, 1000);
    });
};
