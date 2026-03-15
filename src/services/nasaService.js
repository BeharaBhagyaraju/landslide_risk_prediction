/**
 * NASA Service - Fetches records from the Global Landslide Catalog
 * Source: NASA Open Data Portal (via Socrata API)
 */

/**
 * Fetches landslide events within a radius of a location
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} radiusMeters 
 */
export const getNasaHistoricalLandslides = async (lat, lng, radiusMeters = 50000) => {
    try {
        // query for landslides within radius using Socrata's within_circle function
        // The column for location is 'location' (point type)
        const url = `https://data.nasa.gov/resource/itqz-8u6u.json?$where=within_circle(location, ${lat}, ${lng}, ${radiusMeters})&$limit=100`;

        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('NASA API failed');

        const data = await response.json();

        return data.map(item => ({
            id: item.event_id || `nasa-${Math.random()}`,
            lat: parseFloat(item.latitude),
            lng: parseFloat(item.longitude),
            name: item.landslide_type || 'Landslide Event',
            year: item.event_date ? new Date(item.event_date).getFullYear() : 'Unknown',
            severity: item.landslide_size || 'Unknown',
            description: item.country_name ? `Event in ${item.country_name}. ${item.event_description || ''}` : 'NASA Global Landslide Catalog entry',
            source: 'NASA GLC'
        }));
    } catch (error) {
        console.error('Error fetching NASA historical data:', error);
        return [];
    }
};
