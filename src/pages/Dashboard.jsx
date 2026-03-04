import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import DangerAlert from '../components/risk/DangerAlert';

import { getRiskAnalysis } from '../services/mockRiskService';
import { getWeatherData } from '../services/mockWeatherService';
import { checkHistoricalProximity } from '../services/mockHistoricalService';
import { analyzeSatelliteImage, uploadModel } from '../services/mockImageAnalysisService';

// Real services
import { getCurrentPosition, watchPosition, clearWatch, searchPlace } from '../services/locationService';
import { fetchPrediction, saveAssessment } from '../services/predictionService';
import { getElevation, getSoilMoisture, getSlopeSteepness } from '../services/geologyService';
import { get7DayCumulativeRainfall, getCurrentWeather, getWeatherAlerts } from '../services/weatherService';
import { getNasaHistoricalLandslides } from '../services/nasaService';
import { setHistoricalEvents } from '../services/mockHistoricalService';

const POLL_INTERVAL_MS = 60_000;         // 60 seconds — existing monitoring beacon
const AUTO_CHECK_INTERVAL_MS = 3_600_000; // 1 hour — scheduled GPS risk check
const LOCATION_CHANGE_KM = 1.0;           // km threshold before a location-change check fires

/** Haversine distance in km between two GPS points */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Dashboard = () => {
    const [location, setLocation] = useState({ lat: 34.05, lng: -118.25 });
    const [userPosition, setUserPosition] = useState(null); // live GPS "you are here"
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [riskData, setRiskData] = useState(null);
    const [weather, setWeather] = useState(null);
    const [weatherAlert, setWeatherAlert] = useState(null);
    const [historicalProximity, setHistoricalProximity] = useState(null);
    const [satelliteResult, setSatelliteResult] = useState(null);
    const [satelliteImagePreview, setSatelliteImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pendingAssessment, setPendingAssessment] = useState(false);
    const [showDangerAlert, setShowDangerAlert] = useState(false);
    const [alertSource, setAlertSource] = useState('manual'); // 'manual' | 'auto-hourly' | 'auto-location'
    const [alertRiskData, setAlertRiskData] = useState(null); // riskData snapshot to show inside alert
    const [alertLocation, setAlertLocation] = useState(null); // coords snapshot for the alert

    // Continuous monitoring state
    const [monitoringActive, setMonitoringActive] = useState(false);
    const [lastPredictionTime, setLastPredictionTime] = useState(null);

    const watchIdRef = useRef(null);
    const pollTimerRef = useRef(null);
    const hourlyTimerRef = useRef(null);
    const locationRef = useRef(location);
    locationRef.current = location;
    const lastCheckedPosRef = useRef(null);   // last GPS pos we ran a location-change check on
    const lastAutoAlertTimeRef = useRef(0);   // epoch ms of last auto alert — prevents spam

    // ── Fetch dashboard data ──────────────────────────────────────────────────
    const fetchDashboardData = useCallback(async (lat, lng, manualSave = false, autoAlert = false) => {
        setLoading(true);
        setPendingAssessment(false);
        try {
            // 1. Fetch real environmental data from multiple sources
            const [
                elevation,
                rain7Day,
                soilMoisture,
                slope,
                weatherData,
                nasaEvents
            ] = await Promise.all([
                getElevation(lat, lng),
                get7DayCumulativeRainfall(lat, lng),
                getSoilMoisture(lat, lng),
                getSlopeSteepness(lat, lng),
                getCurrentWeather(lat, lng),
                getNasaHistoricalLandslides(lat, lng)
            ]);

            // 2. Add NASA events to our historical database for proximity checks
            if (nasaEvents.length > 0) {
                setHistoricalEvents(prev => {
                    const existingIds = new Set(prev.map(e => e.id));
                    const newUniqueEvents = nasaEvents.filter(e => !existingIds.has(e.id));
                    return [...prev, ...newUniqueEvents];
                });
            }

            // 3. SEQUENTIAL FETCH: Check historical proximity first to influence risk calculation
            const proximity = await checkHistoricalProximity(lat, lng);
            setHistoricalProximity(proximity);

            // 4. Parallel fetch for remaining data using historical influence
            const [risk, alertData] = await Promise.all([
                getRiskAnalysis(lat, lng, rain7Day, elevation, soilMoisture, slope, proximity.impactFactor),
                getWeatherAlerts(lat, lng),
            ]);

            setRiskData(risk);
            setWeather(weatherData);
            setWeatherAlert(alertData);

            // 5. PERSISTENCE: Save this specific assessment to the backend
            // Only triggered via manual "Assess Risk"
            if (manualSave) {
                await saveAssessment({
                    id: `asmt-${Date.now()}`,
                    location_name: `Location Analysis (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                    lat,
                    lng,
                    risk_level: risk.riskLevel,
                    confidence: risk.confidence || 0,
                    details: {
                        environmentalScore: risk.environmentalScore,
                        weatherScore: risk.weatherScore,
                        factors: risk.factors
                    }
                });

                // 6. Show danger alert for manual Assess Risk if High risk
                if (risk.riskLevel === 'High') {
                    setShowDangerAlert(true);
                }
            }

            // 7. AUTO ALERT: fire when triggered by GPS auto-check (not saved to history)
            if (autoAlert && risk.riskLevel === 'High') {
                const now = Date.now();
                if (now - lastAutoAlertTimeRef.current >= 30 * 60 * 1000) {
                    lastAutoAlertTimeRef.current = now;
                    setAlertSource('auto-location');
                    setAlertLocation({ lat, lng });
                    setAlertRiskData(risk);
                    setShowDangerAlert(true);
                }
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAssessRisk = () => {
        setAlertSource('manual');
        fetchDashboardData(location.lat, location.lng, true);
    };

    // ── Background risk check — uses getRiskAnalysis (same source as dashboard) ──────
    // Used for hourly timer and watchPosition location-change detection.
    const runBackgroundRiskCheck = useCallback(async (lat, lng, source) => {
        // Anti-spam: don't re-alert if we already alerted within the last 30 minutes
        const now = Date.now();
        if (now - lastAutoAlertTimeRef.current < 30 * 60 * 1000) return;

        try {
            // Use the same services as the dashboard (not fetchPrediction which hits the backend
            // and returns 'Unknown' when offline)
            const [elevation, rain7Day, soilMoisture, slope] = await Promise.all([
                getElevation(lat, lng),
                get7DayCumulativeRainfall(lat, lng),
                getSoilMoisture(lat, lng),
                getSlopeSteepness(lat, lng),
            ]);
            const proximity = await checkHistoricalProximity(lat, lng);
            const risk = await getRiskAnalysis(lat, lng, rain7Day, elevation, soilMoisture, slope, proximity.impactFactor);

            console.log(`[AutoCheck:${source}] risk=${risk.riskLevel} at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

            if (risk.riskLevel === 'High') {
                lastAutoAlertTimeRef.current = now;
                setAlertSource(source);
                setAlertLocation({ lat, lng });
                setAlertRiskData(risk);
                setShowDangerAlert(true);
            }
        } catch (err) {
            console.warn(`[AutoCheck:${source}] Failed:`, err.message);
        }
    }, []);

    // ── Start 60-second prediction polling ───────────────────────────────────
    const startMonitoring = useCallback(() => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);

        const doPoll = async () => {
            if (pendingAssessment) return; // Don't poll while waiting for initial assessment
            const { lat, lng } = locationRef.current;
            console.log(`[Monitor] Polling /predict at lat=${lat}, lng=${lng}`);
            const result = await fetchPrediction(lat, lng);
            setLastPredictionTime(result.timestamp);
            setMonitoringActive(result.source === 'api');
            console.log('[Monitor] Prediction result:', result);
        };

        // Fire immediately, then repeat
        doPoll();
        pollTimerRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
        setMonitoringActive(true);
    }, [pendingAssessment]);

    // ── Auto-request geolocation on mount ────────────────────────────────────
    useEffect(() => {
        // Get real GPS first — map auto-centers and risk is predicted for actual location.
        // Falls back to default coords only if GPS is denied.
        getCurrentPosition()
            .then((pos) => {
                setUserPosition(pos);
                setLocation(pos);
                locationRef.current = pos;
                lastCheckedPosRef.current = pos;

                // Load full dashboard for real GPS (no save to history, auto-alert if High)
                fetchDashboardData(pos.lat, pos.lng, false, true);
            })
            .catch((err) => {
                console.warn('Geolocation denied or failed:', err.message);
                // GPS denied — fall back to default coordinates
                fetchDashboardData(location.lat, location.lng, false);
            });

        // Start watchPosition for live tracking + location-change risk checks
        watchIdRef.current = watchPosition(
            (pos) => {
                setUserPosition(pos);

                // Location-change check: fire if user moved ≥ LOCATION_CHANGE_KM from last checked spot
                const prev = lastCheckedPosRef.current;
                if (prev) {
                    const dist = haversineDistance(prev.lat, prev.lng, pos.lat, pos.lng);
                    if (dist >= LOCATION_CHANGE_KM) {
                        lastCheckedPosRef.current = pos;
                        runBackgroundRiskCheck(pos.lat, pos.lng, 'auto-location');
                    }
                } else {
                    lastCheckedPosRef.current = pos;
                }
            },
            (err) => console.warn('watchPosition error:', err.message)
        );

        // Start monitoring loop
        startMonitoring();

        return () => {
            clearWatch(watchIdRef.current);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            if (hourlyTimerRef.current) clearInterval(hourlyTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Hourly GPS risk check ───────────────────────────────────────────────────
    useEffect(() => {
        const doHourlyCheck = async () => {
            try {
                const pos = await getCurrentPosition();
                console.log('[HourlyCheck] Scheduled risk check at', pos);
                runBackgroundRiskCheck(pos.lat, pos.lng, 'auto-hourly');
            } catch {
                // GPS denied — fall back to last known location
                const { lat, lng } = locationRef.current;
                runBackgroundRiskCheck(lat, lng, 'auto-hourly');
            }
        };

        hourlyTimerRef.current = setInterval(doHourlyCheck, AUTO_CHECK_INTERVAL_MS);
        return () => clearInterval(hourlyTimerRef.current);
    }, [runBackgroundRiskCheck]);

    // Restart monitoring if location state changes (so polling uses new coords)
    useEffect(() => {
        if (pollTimerRef.current) {
            // Reset the interval so the next tick fires in 60s from the new location
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = setInterval(async () => {
                if (pendingAssessment) return;
                const { lat, lng } = locationRef.current;
                const result = await fetchPrediction(lat, lng);
                setLastPredictionTime(result.timestamp);
                setMonitoringActive(result.source === 'api');
            }, POLL_INTERVAL_MS);
        }
    }, [location, pendingAssessment]);

    // ── Map click ─────────────────────────────────────────────────────────────
    const handleLocationSelect = (latlng) => {
        const newLoc = { lat: latlng.lat, lng: latlng.lng };
        setLocation(newLoc);
        setPendingAssessment(true);
    };

    // ── Go to custom coordinates ─────────────────────────────────────────────
    const handleGoToCoords = ({ lat: newLat, lng: newLng }) => {
        const newLoc = { lat: newLat, lng: newLng };
        setLocation(newLoc);
        setPendingAssessment(true);
    };

    // ── Search (Nominatim) ────────────────────────────────────────────────────
    const handleSearch = async (query, resultCallback, selectedResult) => {
        if (selectedResult) {
            // User picked a result from dropdown
            const newLoc = { lat: selectedResult.lat, lng: selectedResult.lng };
            setLocation(newLoc);
            setPendingAssessment(true);
            return;
        }
        if (query && resultCallback) {
            try {
                const places = await searchPlace(query);
                resultCallback(places);
                // Auto-select first result when pressing Enter / if only one result
                if (places.length === 1) {
                    const newLoc = { lat: places[0].lat, lng: places[0].lng };
                    setLocation(newLoc);
                    setPendingAssessment(true);
                }
            } catch (err) {
                console.error('Nominatim search failed:', err);
                resultCallback([]);
            }
        }
    };

    // ── Use My Location button ────────────────────────────────────────────────
    const handleUseCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const pos = await getCurrentPosition();
            setUserPosition(pos);
            setLocation(pos);
            setPendingAssessment(true);
        } catch (err) {
            console.warn('Could not get location:', err.message);
            alert('Location access denied. Please allow location in your browser settings.');
        } finally {
            setLocationLoading(false);
        }
    };

    // ── Satellite ────────────────────────────────────────────────────────────
    const handleImageUpload = async (imageSource) => {
        setIsAnalyzing(true);

        // Handle both File objects and base64 strings
        const previewUrl = typeof imageSource === 'string'
            ? imageSource
            : URL.createObjectURL(imageSource);

        setSatelliteImagePreview(previewUrl);

        try {
            const result = await analyzeSatelliteImage(imageSource);
            setSatelliteResult(result);
        } catch (error) {
            console.error('Analysis failed', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleModelUpload = async (file) => {
        try {
            const result = await uploadModel(file);
            console.log('Model uploaded successfully', result);

            // Guard against null/empty results (e.g. backend returned 200 with no body)
            if (!result) {
                console.warn('Upload returned null result, skipping auto-analysis');
                return result;
            }

            // AUTO-ANALYSIS: If a dataset was uploaded and an image was extracted, run analysis immediately
            if (result.isDataset && result.preview) {
                setTimeout(() => {
                    handleImageUpload(result.preview);
                }, 500);
            }

            return result;
        } catch (error) {
            console.error('Model upload failed', error);
            alert(`Failed to upload model: ${error.message}`);
            throw error;
        }
    };

    if (loading && !riskData) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500">
                Loading Dashboard Data…
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-12">
            {/* ── High-Risk Danger Alert Modal ── */}
            {/* Shown after manual Assess Risk (uses full riskData) OR auto background checks */}
            <DangerAlert
                show={showDangerAlert}
                riskData={alertSource === 'manual' ? riskData : alertRiskData}
                location={alertSource === 'manual' ? location : (alertLocation ?? location)}
                source={alertSource}
                onClose={() => setShowDangerAlert(false)}
            />
            {/* Row 1: Key Performance Indicators (KPIs) */}
            <RiskCards riskData={riskData} />

            {/* Row 2: Main Monitoring Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Mobile Priority: Controls & Risk Meter (Moves to right on desktop) */}
                <div className="order-first lg:order-last space-y-4 flex flex-col h-full">
                    <RiskGauge value={riskData?.overallRisk ?? 0} />
                    <div className="space-y-3 flex-1">
                        <LocationSelector
                            lat={location.lat}
                            lng={location.lng}
                            onSearch={handleSearch}
                            onUseCurrentLocation={handleUseCurrentLocation}
                            onGoToCoords={handleGoToCoords}
                            isLoading={locationLoading}
                            monitoringActive={monitoringActive}
                            lastPredictionTime={lastPredictionTime}
                            pendingAssessment={pendingAssessment}
                            onAssessRisk={handleAssessRisk}
                        />
                        <WeatherPanel weather={weather} />
                        {weatherAlert && <WeatherAlert alert={weatherAlert} />}
                        <HistoricalProximityCard analysis={historicalProximity} />
                    </div>
                </div>

                {/* Left: Interactive Map & Primary Analytics (Occupies main space) */}
                <div className="lg:col-span-3 flex flex-col space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[350px] md:min-h-[500px] flex-1">
                        <MapView
                            lat={location.lat}
                            lng={location.lng}
                            onMapClick={handleLocationSelect}
                            userPosition={userPosition}
                            historicalProximity={historicalProximity}
                        />
                    </div>

                    {/* Integrated Monitoring Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                        <div className="h-full">
                            <RiskTrendChart data={riskData?.trend} />
                        </div>
                        <div className="h-full">
                            <RiskFactors factors={riskData?.factors} />
                        </div>
                        <div className="h-full">
                            <ReportGenerator
                                riskData={riskData}
                                weather={weather}
                                location={location}
                                historicalProximity={historicalProximity}
                            />
                        </div>
                    </div>

                    {/* Satellite Imagery AI Analysis */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-semibold text-slate-900 leading-tight">Satellite Imagery Analysis</h3>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em] mt-0.5">Automated Geohazard Detection</p>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-md tracking-wider">Early Warning System</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <SatelliteUpload
                                onUpload={handleImageUpload}
                                onModelUpload={handleModelUpload}
                                isAnalyzing={isAnalyzing}
                            />
                            {isAnalyzing ? (
                                <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl text-slate-500 animate-pulse border border-dashed border-slate-200">
                                    <div className="text-center">
                                        <div className="mb-2 font-medium">Analyzing spectral bands...</div>
                                        <div className="text-[10px] text-slate-400 font-mono">Running Cloud Masking...</div>
                                    </div>
                                </div>
                            ) : (
                                satelliteResult && (
                                    <div className="lg:col-span-1">
                                        <ImageResult result={satelliteResult} originalImage={satelliteImagePreview} />
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
