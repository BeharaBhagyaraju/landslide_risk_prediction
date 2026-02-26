import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import PropTypes from 'prop-types';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import MapController from './MapController';

// Fix for default marker icon in leaflet with webpack/vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// "You are here" — blue pulsing circle marker
const UserLocationMarker = ({ position }) => {
    if (!position) return null;
    return (
        <>
            {/* Accuracy circle — subtle outer ring */}
            <Circle
                center={position}
                radius={80}
                pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.12,
                    weight: 1,
                }}
            />
            {/* Precise dot */}
            <Circle
                center={position}
                radius={18}
                pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.9,
                    weight: 2,
                }}
            >
                <Popup>
                    <strong>📍 You are here</strong>
                    <br />
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                </Popup>
            </Circle>
        </>
    );
};

UserLocationMarker.propTypes = {
    position: PropTypes.array,
};

// Helper to fly map to a new centre when props change
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    const lastPos = React.useRef(null);

    useEffect(() => {
        const isSame = lastPos.current &&
            lastPos.current[0] === center[0] &&
            lastPos.current[1] === center[1];

        if (!isSame) {
            map.flyTo(center, zoom, { duration: 1.2 });
            lastPos.current = center;
        }
    }, [center, zoom, map]);
    return null;
};

ChangeView.propTypes = {
    center: PropTypes.array.isRequired,
    zoom: PropTypes.number.isRequired,
};

// Floating Re-center Button Component
const RecenterButton = ({ position }) => {
    const map = useMap();
    if (!position) return null;

    return (
        <div className="leaflet-top leaflet-right mt-12 mr-3 pointer-events-auto" style={{ zIndex: 1000 }}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    map.flyTo(position, 15, { duration: 1.5 });
                }}
                className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 text-blue-600 hover:bg-slate-50 transition-all active:scale-95 group flex items-center justify-center"
                title="Re-center to my location"
            >
                <LocateFixed size={20} />
            </button>
        </div>
    );
};

RecenterButton.propTypes = {
    position: PropTypes.array,
};

const MapView = ({ lat, lng, onMapClick, markers = [], userPosition = null, historicalProximity = null }) => {
    const position = [lat, lng];
    const userPos = userPosition ? [userPosition.lat, userPosition.lng] : null;

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 z-0 relative">
            <MapContainer
                center={position}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <ChangeView center={position} zoom={13} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Selected / clicked location marker */}
                <Marker position={position}>
                    <Popup>
                        <strong>📌 Selected Location</strong>
                        <br />
                        Lat: {lat.toFixed(5)}
                        <br />
                        Lng: {lng.toFixed(5)}
                    </Popup>
                </Marker>

                {/* Historical Proximity Alert (Red Zone) */}
                {historicalProximity?.isClose && (
                    <>
                        <Circle
                            center={[historicalProximity.closestLat, historicalProximity.closestLng]}
                            radius={100000} // 100km in meters
                            pathOptions={{
                                color: '#ef4444',
                                fillColor: '#ef4444',
                                fillOpacity: 0.1,
                                weight: 2,
                                dashArray: '5, 10'
                            }}
                        />
                        <Circle
                            center={[historicalProximity.closestLat, historicalProximity.closestLng]}
                            radius={800}
                            pathOptions={{
                                color: '#b91c1c',
                                fillColor: '#ef4444',
                                fillOpacity: 0.9,
                                weight: 3
                            }}
                        >
                            <Popup>
                                <div className="text-red-700 font-bold">⚠️ Historical Landslide Event</div>
                                <div>{historicalProximity.event}</div>
                                <div className="text-xs text-slate-500">Source: {historicalProximity.source}</div>
                            </Popup>
                        </Circle>
                    </>
                )}

                {/* User's real GPS position */}
                <UserLocationMarker position={userPos} />

                {/* Floating Re-center Button */}
                <RecenterButton position={userPos} />

                {/* Historical / extra markers with clustering */}
                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={50}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                >
                    {markers.map((marker, idx) => (
                        <Marker key={marker.id || idx} position={[marker.lat, marker.lng]}>
                            <Popup>{marker.popupText || (
                                <div>
                                    <strong>{marker.name} ({marker.year})</strong>
                                    <br />
                                    Severity: {marker.severity}
                                    <br />
                                    <span className="text-xs">{marker.description}</span>
                                </div>
                            )}</Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>

                <MapController onMapClick={onMapClick} />
            </MapContainer>
        </div>
    );
};

MapView.propTypes = {
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    onMapClick: PropTypes.func,
    markers: PropTypes.array,
    userPosition: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
    }),
};

export default MapView;
