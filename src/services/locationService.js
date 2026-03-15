/**
 * Real geolocation service using browser Navigator API + Nominatim (OpenStreetMap) for search.
 */

const GEO_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 60000,
};

/**
 * Ask for the user's current position once.
 * Returns Promise<{ lat, lng }>
 */
export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            GEO_OPTIONS
        );
    });
};

/**
 * Watch the user's position continuously.
 * @param {function} onSuccess - called with { lat, lng } on each update
 * @param {function} onError   - called with the GeolocationPositionError
 * @returns {number} watchId – pass to clearWatch() to stop
 */
export const watchPosition = (onSuccess, onError) => {
    if (!navigator.geolocation) {
        onError?.(new Error('Geolocation not supported'));
        return null;
    }
    return navigator.geolocation.watchPosition(
        (pos) => onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        onError,
        GEO_OPTIONS
    );
};

/**
 * Stop watching the user's position.
 * @param {number} watchId
 */
export const clearWatch = (watchId) => {
    if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
    }
};

/**
 * Search for a place name using the free Nominatim API (no key required).
 * @param {string} query - e.g. "Paris" or "Mount Rainier"
 * @returns {Promise<Array<{ lat: number, lng: number, displayName: string }>>}
 */
export const searchPlace = async (query) => {
    if (!query?.trim()) return [];

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
    )}&format=json&limit=5&addressdetails=0`;

    const response = await fetch(url, {
        headers: {
            // Nominatim requires a valid User-Agent
            'Accept-Language': 'en',
        },
    });

    if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);

    const data = await response.json();
    return data.map((item) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
    }));
};
