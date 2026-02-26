// Simulating API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRiskAnalysis = async (lat, lng, rainfall, elevation, soilMoisture, slope, historicalImpact = 0) => {
    await delay(300); // Simulate processing

    // Heuristic Calculation (Weights: Rainfall 40%, Soil Moisture 30%, Slope 30%)
    // Normalize inputs to 0-100 scales
    const rainFactor = Math.min(rainfall / 50, 1) * 100; // 50mm over 7 days is high
    const moistureFactor = soilMoisture * 100; // Assuming 0-1 scale
    const slopeFactor = Math.min(slope / 45, 1) * 100; // 45 degrees is very steep

    // NEW: Historical Factor (Impacts up to 25% of the total risk score)
    // historicalImpact is 0.0 to 1.0 (based on proximity within 100km)
    const historicalScore = historicalImpact * 25;

    const baseRisk = (rainFactor * 0.4) + (moistureFactor * 0.3) + (slopeFactor * 0.3);
    const overallRisk = Math.min(100, Math.round(baseRisk + historicalScore));

    let riskLevel = 'Safe';
    if (overallRisk > 75) riskLevel = 'High';
    else if (overallRisk > 50) riskLevel = 'Medium';
    else if (overallRisk > 25) riskLevel = 'Low';
    else riskLevel = 'Stable';

    return {
        overallRisk,
        riskLevel,
        environmentalScore: Math.round(100 - (slopeFactor * 0.5 + moistureFactor * 0.5)),
        proximityScore: Math.round(rainFactor * 0.8),
        weatherScore: Math.round(rainFactor),
        trend: Array.from({ length: 7 }, (_, i) => ({
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
            risk: Math.max(0, overallRisk + Math.floor(Math.random() * 20) - 10)
        })),
        factors: {
            rainfallIntensity: Math.round(rainFactor),
            slopeAngle: Math.round(slopeFactor),
            vegetation: 65,
            soilMoisture: Math.round(moistureFactor),
            historicalPrecedent: Math.round(historicalScore * 4), // Normalize to 0-100 for display
            temperature: 20,
            windSpeed: 15
        }
    };
};

export const getRiskAssessmentHistory = async () => {
    await delay(500);
    return [
        { id: 101, date: '2023-10-25', coordinates: '34.05, -118.25', riskLevel: 'High Alert', location: 'Santa Monica Mountains' },
        { id: 102, date: '2023-10-24', coordinates: '34.02, -118.40', riskLevel: 'Watch', location: 'Beverly Hills' },
        { id: 103, date: '2023-10-23', coordinates: '33.98, -118.30', riskLevel: 'Safe', location: 'Culver City' },
        { id: 104, date: '2023-10-22', coordinates: '34.10, -118.15', riskLevel: 'Warning', location: 'Pasadena' },
        { id: 105, date: '2023-10-21', coordinates: '34.08, -118.35', riskLevel: 'Safe', location: 'West Hollywood' },
    ]
}
