import React, { useEffect, useState, useMemo } from 'react';
import MapView from '../components/map/MapView';
import HistoricalDataPanel from '../components/history/HistoricalDataPanel';
import { getHistoricalEvents, setHistoricalEvents } from '../services/mockHistoricalService';
import { getNasaHistoricalLandslides } from '../services/nasaService';
import { AlertTriangle, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const EVENTS_PER_PAGE = 10;

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nasaLoading, setNasaLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'desc' });

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch both local/mock events and NASA events
                const [localData, nasaData] = await Promise.all([
                    getHistoricalEvents(),
                    getNasaHistoricalLandslides(20, 78, 500000) // Default wide view for global explorer
                ]);

                const combined = [...localData, ...nasaData];
                setEvents(combined);
                setHistoricalEvents(combined);
            } catch (error) {
                console.error("Failed to load events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleDataLoaded = (newPoints) => {
        const updatedEvents = [...newPoints, ...events];
        setEvents(updatedEvents);
        setHistoricalEvents(updatedEvents);
        setCurrentPage(1);
    };

    const filteredEvents = useMemo(() => {
        return events.filter(event =>
            (event.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (event.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (event.year?.toString().includes(searchTerm)) ||
            (event.severity?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [events, searchTerm]);

    const sortedEvents = useMemo(() => {
        const sorted = [...filteredEvents];
        sorted.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredEvents, sortConfig]);

    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
        return sortedEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);
    }, [sortedEvents, currentPage]);

    const totalPages = Math.ceil(sortedEvents.length / EVENTS_PER_PAGE);

    const toggleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-100">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Geospatial History Explorer</h1>
                        <p className="text-slate-500">Analyze 11,000+ historical landslide events and patterns.</p>
                    </div>
                </div>
            </div>

            <HistoricalDataPanel onDataLoaded={handleDataLoaded} currentCount={events.length} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700">Event Distribution Map</span>
                            <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                                {events.length.toLocaleString()} points loaded
                            </div>
                        </div>
                        <MapView
                            lat={20}
                            lng={78}
                            markers={events}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-indigo-600" />
                            Refine Search
                        </h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, year, severity..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-500 font-medium">Filtered</div>
                                    <div className="text-xl font-bold text-slate-900">{filteredEvents.length.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="text-xs text-indigo-600 font-medium">Total</div>
                                    <div className="text-xl font-bold text-indigo-900">{events.length.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
                        <h4 className="font-bold mb-2">Did you know?</h4>
                        <p className="text-sm text-indigo-100 leading-relaxed">
                            Looking at historical patterns can help predict future risks. Locations within 5km of a recorded event are considered high-priority for monitoring.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('year')}>
                                    Year/Date <ArrowUpDown className="inline w-3 h-3 ml-1" />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('severity')}>
                                    Severity <ArrowUpDown className="inline w-3 h-3 ml-1" />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Coordinates</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedEvents.length > 0 ? paginatedEvents.map((event) => (
                                <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{event.year}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{event.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${event.severity?.toLowerCase() === 'catastrophic' ? 'bg-red-100 text-red-700' :
                                            event.severity?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {event.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                        {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{event.description}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                        No matching events found. Try adjusting your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Showing page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Events;
