const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const analyzeSatelliteImage = async (file) => {
    await delay(2500); // Simulate processing time

    // Randomize result
    const isRisk = Math.random() > 0.5;

    return {
        riskLevel: isRisk ? 'High' : 'Low',
        confidence: 87,
        featuresDetected: [
            isRisk ? 'Soil Saturation Detected' : 'Stable Vegetation',
            isRisk ? 'Slope Instability Signs' : 'No Erosion Visible',
            'Topographic Anomalies: 2'
        ],
        recommendation: isRisk
            ? 'Immediate geotechnical inspection recommended.'
            : 'No immediate action required. Continue monitoring.'
    };
};
