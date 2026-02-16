import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

const LocationSelector = ({ onSearch, onUseCurrentLocation, isLoading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Location Selection
            </h3>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Search coordinates or place..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    disabled={isLoading}
                >
                    Search
                </button>
            </form>

            <button
                onClick={onUseCurrentLocation}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-lg text-sm font-medium transition-colors border border-blue-100"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Use Current Location
            </button>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Lat: <span className="font-mono text-slate-600">--.----</span></span>
                <span>Lng: <span className="font-mono text-slate-600">--.----</span></span>
            </div>
        </div>
    );
};

LocationSelector.propTypes = {
    onSearch: PropTypes.func.isRequired,
    onUseCurrentLocation: PropTypes.func.isRequired,
    isLoading: PropTypes.bool
};

export default LocationSelector;
