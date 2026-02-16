import React, { useEffect, useState } from 'react';
import MapView from '../components/map/MapView';
import { getHistoricalEvents } from '../services/mockHistoricalService';
import { AlertTriangle } from 'lucide-react';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await getHistoricalEvents();
                // Map events to markers format
                const markers = data.map(event => ({
                    lat: event.lat,
                    lng: event.lng,
                    popupText: (
                        <div>
                            <strong>{event.name} ({event.year})</strong>
                            <br />
                            Severity: {event.severity}
                            <br />
                            <span className="text-xs">{event.description}</span>
                        </div>
                    )
                }));
                setEvents(markers);
            } catch (error) {
                console.error("Failed to load events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Historical Landslide Events</h1>
                    <p className="text-slate-500">Geospatial database of known major landslide incidents.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading event data...</div>
            ) : (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <MapView
                        lat={34.05}
                        lng={-118.25}
                        markers={events}
                    />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Legend or list could go here */}
                        <div className="text-sm text-slate-500">
                            Showing {events.length} recorded major events in the region.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
