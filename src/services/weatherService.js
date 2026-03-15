/**
 * Weather Service - Fetches real-world meteorological data
 * Source: Open-Meteo API (Free, No Key Required)
 */

const getWmoWeatherLabel = (code) => {
    const mapping = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing Rime Fog',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Slight Snow',
        73: 'Moderate Snow',
        75: 'Heavy Snow',
        80: 'Slight Rain Showers',
        81: 'Moderate Rain Showers',
        82: 'Violent Rain Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Hail',
        99: 'Heavy Thunderstorm with Hail',
    };
    return mapping[code] || 'Unknown';
};

/**
 * Fetches current weather and last 7 days of rainfall in one request
 */
const fetchOpenMeteoData = async (lat, lng) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_sum&past_days=7&timezone=auto`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Open-Meteo API error: ${response.status}`);
    return await response.json();
};

/**
 * Fetches the last 7 days of rainfall data for a location
 */
export const getRainfallHistory = async (lat, lng) => {
    try {
        const data = await fetchOpenMeteoData(lat, lng);
        if (!data.daily) throw new Error('No daily data returned');

        return data.daily.time.map((time, index) => ({
            date: time,
            precip: data.daily.precipitation_sum[index] || 0
        }));
    } catch (error) {
        console.error('Error fetching rainfall history:', error);
        return generateMockRainfall();
    }
};

/**
 * Calculates cumulative rainfall over the last 7 days
 */
export const get7DayCumulativeRainfall = async (lat, lng) => {
    try {
        const history = await getRainfallHistory(lat, lng);
        const total = history.reduce((sum, day) => sum + day.precip, 0);
        return Number(total.toFixed(2));
    } catch (error) {
        return 0;
    }
};

/**
 * Fetches current weather summary including rainfall history
 */
export const getCurrentWeather = async (lat, lng) => {
    try {
        const data = await fetchOpenMeteoData(lat, lng);
        const history = data.daily.time.map((time, index) => ({
            date: time,
            precip: data.daily.precipitation_sum[index] || 0
        }));

        const total7DayRain = history.reduce((sum, day) => sum + day.precip, 0);

        return {
            temp: Math.round(data.current.temperature_2m),
            condition: getWmoWeatherLabel(data.current.weather_code),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            total7DayRain: Number(total7DayRain.toFixed(1)),
            rainfallHistory: history
        };
    } catch (error) {
        console.error('Error fetching current weather:', error);
        return {
            temp: 20,
            condition: 'Clear',
            humidity: 50,
            windSpeed: 5,
            total7DayRain: 0,
            rainfallHistory: generateMockRainfall()
        };
    }
};

/**
 * Generates automated weather alerts based on environmental data
 */
export const getWeatherAlerts = async (lat, lng) => {
    try {
        const rain7Day = await get7DayCumulativeRainfall(lat, lng);

        if (rain7Day > 30) {
            return {
                severity: 'red',
                message: `CRITICAL: ${rain7Day}mm of rain in 7 days detected. Extremely high risk of slope failure and flash floods.`
            };
        } else if (rain7Day > 15) {
            return {
                severity: 'orange',
                message: `WARNING: High cumulative rainfall (${rain7Day}mm). Soil saturation levels are approaching critical thresholds.`
            };
        } else if (rain7Day > 5) {
            return {
                severity: 'yellow',
                message: `ADVISORY: Moderate rainfall detected. Terrain stability may be reduced in high-slope areas.`
            };
        }
    } catch (e) {
        return null;
    }

    return null; // No alert
};

const generateMockRainfall = () => {
    return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        precip: Number((Math.random() * 5).toFixed(2))
    }));
};
