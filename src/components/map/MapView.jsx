import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
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
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
};

ChangeView.propTypes = {
    center: PropTypes.array.isRequired,
    zoom: PropTypes.number.isRequired,
};

const MapView = ({ lat, lng, onMapClick, markers = [], userPosition = null }) => {
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

                {/* User's real GPS position */}
                <UserLocationMarker position={userPos} />

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
