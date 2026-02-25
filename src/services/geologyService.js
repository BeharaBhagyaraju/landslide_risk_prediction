/**
 * Geology Service - Fetches real-world environmental data
 * Sources: Open-Meteo (Elevation, Soil Moisture)
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches elevation for a specific point
 */
export const getElevation = async (lat, lng) => {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
        if (!response.ok) throw new Error('Elevation API failed');
        const data = await response.json();
        return data.elevation[0] || 0;
    } catch (error) {
        console.error('Error fetching elevation:', error);
        // Fallback to a mock value based on coordinates if API fails
        return Math.floor(Math.random() * 500) + 100;
    }
};

/**
 * Fetches current soil moisture from Open-Meteo
 */
export const getSoilMoisture = async (lat, lng) => {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=soil_moisture_0_to_1cm`);
        if (!response.ok) throw new Error('Soil Moisture API failed');
        const data = await response.json();
        return data.current.soil_moisture_0_to_1cm || 0;
    } catch (error) {
        console.error('Error fetching soil moisture:', error);
        // Fallback to dummy data
        return 0.25;
    }
};

/**
 * Heuristic prediction of slope steepness based on elevation changes
 * (Simple mock implementation for now as high-res DEM APIs are complex)
 */
export const getSlopeSteepness = async (lat, lng) => {
    // In a real app, we'd query a digital elevation model or multiple points
    // For now, return a realistic range based on elevation
    const elevation = await getElevation(lat, lng);
    if (elevation > 1000) return Math.floor(Math.random() * 20) + 15; // Steeper in mountains
    return Math.floor(Math.random() * 10) + 2;
};
