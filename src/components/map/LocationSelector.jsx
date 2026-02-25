import React, { useState, useRef } from 'react';
import { Search, MapPin, Loader2, Navigation, Wifi, WifiOff, ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';

const LocationSelector = ({
    lat,
    lng,
    onSearch,
    onUseCurrentLocation,
    isLoading,
    monitoringActive,
    lastPredictionTime,
    onGoToCoords,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef(null);

    // Custom lat/lng inputs
    const [customLat, setCustomLat] = useState('');
    const [customLng, setCustomLng] = useState('');
    const [coordError, setCoordError] = useState('');

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (!val.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onSearch(val, (res) => {
                setResults(res);
                setShowDropdown(res.length > 0);
                setSearching(false);
            });
            setSearching(true);
        }, 400);
    };

    const handleResultClick = (result) => {
        setQuery(result.displayName.split(',')[0]);
        setShowDropdown(false);
        setResults([]);
        onSearch(null, null, result);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowDropdown(false);
    };

    const handleGoToCoords = (e) => {
        e.preventDefault();
        setCoordError('');
        const parsedLat = parseFloat(customLat);
        const parsedLng = parseFloat(customLng);
        if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
            setCoordError('Latitude must be between -90 and 90');
            return;
        }
        if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
            setCoordError('Longitude must be between -180 and 180');
            return;
        }
        onGoToCoords({ lat: parsedLat, lng: parsedLng });
        setCustomLat('');
        setCustomLng('');
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Location Selection
                </h3>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${monitoringActive
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                    {monitoringActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {monitoringActive ? 'Monitoring' : 'Offline'}
                </span>
            </div>

            {/* Place search */}
            <form onSubmit={handleSubmit} className="relative mb-3">
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Search any place worldwide…"
                            value={query}
                            onChange={handleQueryChange}
                            onFocus={() => results.length > 0 && setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                            autoComplete="off"
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 animate-spin" />
                        )}
                    </div>
                </div>
                {showDropdown && (
                    <ul className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                        {results.map((r, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    onMouseDown={() => handleResultClick(r)}
                                    className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-100 last:border-0 truncate"
                                >
                                    <MapPin className="inline w-3 h-3 mr-1.5 text-slate-400" />
                                    {r.displayName}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </form>

            {/* ── Custom Lat / Lng Go-To ─────────────────────────────────── */}
            <div className="mb-3">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5">
                    Go to coordinates
                </p>
                <form onSubmit={handleGoToCoords} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            step="any"
                            placeholder="Latitude"
                            value={customLat}
                            onChange={(e) => { setCustomLat(e.target.value); setCoordError(''); }}
                            className="w-full min-w-0 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                        />
                        <input
                            type="number"
                            step="any"
                            placeholder="Longitude"
                            value={customLng}
                            onChange={(e) => { setCustomLng(e.target.value); setCoordError(''); }}
                            className="w-full min-w-0 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
                    >
                        <ArrowRight className="w-4 h-4" />
                        Go to Coordinates
                    </button>
                </form>
                {coordError && (
                    <p className="text-xs text-red-500 mt-1">{coordError}</p>
                )}
            </div>

            {/* Use My Location */}
            <button
                onClick={onUseCurrentLocation}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-lg text-sm font-medium transition-colors border border-blue-100 disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Navigation className="w-4 h-4" />
                )}
                Use My Location
            </button>

            {/* Live coordinates display */}
            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Latitude</p>
                    <p className="font-mono text-sm font-semibold text-slate-700">
                        {lat != null ? lat.toFixed(5) : '--'}
                    </p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Longitude</p>
                    <p className="font-mono text-sm font-semibold text-slate-700">
                        {lng != null ? lng.toFixed(5) : '--'}
                    </p>
                </div>
            </div>

            {lastPredictionTime && (
                <p className="mt-2 text-xs text-slate-400 text-center">
                    Last prediction: {new Date(lastPredictionTime).toLocaleTimeString()}
                </p>
            )}
        </div>
    );
};

LocationSelector.propTypes = {
    lat: PropTypes.number,
    lng: PropTypes.number,
    onSearch: PropTypes.func.isRequired,
    onUseCurrentLocation: PropTypes.func.isRequired,
    onGoToCoords: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    monitoringActive: PropTypes.bool,
    lastPredictionTime: PropTypes.string,
};

export default LocationSelector;
