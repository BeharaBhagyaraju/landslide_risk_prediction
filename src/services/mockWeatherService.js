const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getWeatherData = async (lat, lng) => {
    await delay(600);

    // Randomize slightly for demo
    const temp = Math.floor(Math.random() * (30 - 15) + 15);

    return {
        temperature: temp,
        humidity: 78,
        windSpeed: 15, // km/h
        condition: 'Heavy Rain',
        forecast: [
            { day: 'Today', rainfall: 25, temp: temp },
            { day: 'Tomorrow', rainfall: 40, temp: temp - 2 },
            { day: 'Wed', rainfall: 10, temp: temp + 1 },
        ]
    };
};

export const getWeatherAlerts = async (lat, lng) => {
    await delay(400);
    // Return null if no alert, or object if alert exists
    // Simulating an alert for demonstration
    return {
        severity: 'orange', // yellow, orange, red
        message: 'Heavy rainfall expected within 24–48 hours. Soil saturation levels approaching critical threshold.'
    };
}
