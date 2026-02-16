// Simulating API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRiskAnalysis = async (locationId) => {
    await delay(800); // Simulate network latency

    // Mock data varying slightly based on locationId for realism
    const isHighRisk = locationId === 'loc-2';

    return {
        overallRisk: isHighRisk ? 85 : 42,
        riskLevel: isHighRisk ? 'High Alert' : 'Watch',
        environmentalScore: isHighRisk ? 30 : 65, // Lower is worse
        proximityScore: isHighRisk ? 90 : 20, // Higher is worse
        weatherScore: isHighRisk ? 80 : 45, // Higher is worse (more rain)
        trend: [
            { day: 'Mon', risk: 30 },
            { day: 'Tue', risk: 35 },
            { day: 'Wed', risk: 40 },
            { day: 'Thu', risk: isHighRisk ? 60 : 38 },
            { day: 'Fri', risk: isHighRisk ? 75 : 42 },
            { day: 'Sat', risk: isHighRisk ? 82 : 40 },
            { day: 'Sun', risk: isHighRisk ? 85 : 42 },
        ],
        factors: {
            rainfallIntensity: isHighRisk ? 90 : 40,
            slopeAngle: isHighRisk ? 75 : 30,
            vegetation: isHighRisk ? 20 : 80, // Low vegetation = high risk
            soilMoisture: isHighRisk ? 85 : 50,
            temperature: 60,
            windSpeed: 30
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
