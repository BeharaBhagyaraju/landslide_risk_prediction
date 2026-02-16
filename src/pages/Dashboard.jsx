import React, { useState, useEffect } from 'react';
import MapView from '../components/map/MapView';
import LocationSelector from '../components/map/LocationSelector';
import RiskCards from '../components/risk/RiskCards';
import RiskGauge from '../components/risk/RiskGauge';
import RiskTrendChart from '../components/risk/RiskTrendChart';
import RiskFactors from '../components/risk/RiskFactors';
import WeatherPanel from '../components/weather/WeatherPanel';
import WeatherAlert from '../components/weather/WeatherAlert';
import HistoricalProximityCard from '../components/history/HistoricalProximityCard';
import ReportGenerator from '../components/report/ReportGenerator';
import SatelliteUpload from '../components/image/SatelliteUpload';
import ImageResult from '../components/image/ImageResult';

import { getRiskAnalysis } from '../services/mockRiskService';
import { getWeatherData, getWeatherAlerts } from '../services/mockWeatherService';
import { checkHistoricalProximity } from '../services/mockHistoricalService';
import { analyzeSatelliteImage } from '../services/mockImageAnalysisService';
import { getCurrentLocation } from '../services/mockLocationService';

const Dashboard = () => {
    const [location, setLocation] = useState({ lat: 34.05, lng: -118.25 });
    const [loading, setLoading] = useState(true);
    const [riskData, setRiskData] = useState(null);
    const [weather, setWeather] = useState(null);
    const [weatherAlert, setWeatherAlert] = useState(null);
    const [historicalProximity, setHistoricalProximity] = useState(null);
    const [satelliteResult, setSatelliteResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Initial load
    useEffect(() => {
        fetchDashboardData(location.lat, location.lng);
    }, []);

    const fetchDashboardData = async (lat, lng) => {
        setLoading(true);
        try {
            // Parallel data fetching
            const [risk, weatherData, alertData, historyData] = await Promise.all([
                getRiskAnalysis('loc-1'), // Simulate location ID
                getWeatherData(lat, lng),
                getWeatherAlerts(lat, lng),
                checkHistoricalProximity(lat, lng)
            ]);

            setRiskData(risk);
            setWeather(weatherData);
            setWeatherAlert(alertData);
            setHistoricalProximity(historyData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = (latlng) => {
        setLocation(latlng);
        fetchDashboardData(latlng.lat, latlng.lng);
    };

    const handleSearch = (query) => {
        // Mock search: just move slightly for demo
        console.log("Searching for:", query);
        const newLoc = { lat: 34.1 + Math.random() * 0.1, lng: -118.5 + Math.random() * 0.1 };
        setLocation(newLoc);
        fetchDashboardData(newLoc.lat, newLoc.lng);
    };

    const handleUseCurrentLocation = async () => {
        const loc = await getCurrentLocation();
        setLocation(loc);
        fetchDashboardData(loc.lat, loc.lng);
    };

    const handleImageUpload = async (file) => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeSatelliteImage(file);
            setSatelliteResult(result);
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading && !riskData) {
        return <div className="flex h-screen items-center justify-center text-slate-500">Loading Dashboard Data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Row 1: Risk Summary Cards */}
            <RiskCards riskData={riskData} />

            {/* Row 2: Main Monitoring Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Map */}
                <div className="col-span-2">
                    <MapView
                        lat={location.lat}
                        lng={location.lng}
                        onMapClick={handleLocationSelect}
                    />
                </div>

                {/* Right: Control Panel */}
                <div className="space-y-6">
                    <LocationSelector
                        onSearch={handleSearch}
                        onUseCurrentLocation={handleUseCurrentLocation}
                        isLoading={loading}
                    />
                    <WeatherPanel weather={weather} />
                    <WeatherAlert alert={weatherAlert} />
                </div>
            </div>

            {/* Row 3: Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RiskGauge value={riskData.overallRisk} />
                <div className="lg:col-span-2">
                    <RiskTrendChart data={riskData.trend} />
                </div>
                <div className="space-y-6">
                    <HistoricalProximityCard analysis={historicalProximity} />
                    <ReportGenerator />
                </div>
            </div>

            {/* Row extra: Risk Factors */}
            <div className="grid grid-cols-1">
                <RiskFactors factors={riskData.factors} />
            </div>

            {/* Row 4: Satellite Analysis */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Satellite Image Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <SatelliteUpload onUpload={handleImageUpload} isAnalyzing={isAnalyzing} />
                    {isAnalyzing ? (
                        <div className="flex items-center justify-center h-40 text-slate-500 animate-pulse">
                            Processing imagery using AI models...
                        </div>
                    ) : (
                        <ImageResult result={satelliteResult} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
