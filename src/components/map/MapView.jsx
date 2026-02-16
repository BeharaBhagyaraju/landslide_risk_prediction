import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import L from 'leaflet';
import MapController from './MapController';

// Fix for default marker icon in leaflet with webpack/vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map when props change
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

const MapView = ({ lat, lng, onMapClick, markers = [] }) => {
    const position = [lat, lng];

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 z-0 relative">
            <MapContainer
                center={position}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <ChangeView center={position} zoom={13} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={position}>
                    <Popup>
                        Selected Location <br /> {lat.toFixed(4)}, {lng.toFixed(4)}
                    </Popup>
                </Marker>

                {markers.map((marker, idx) => (
                    <Marker key={idx} position={[marker.lat, marker.lng]}>
                        <Popup>{marker.popupText}</Popup>
                    </Marker>
                ))}

                <MapController onMapClick={onMapClick} />
            </MapContainer>
        </div>
    );
};

MapView.propTypes = {
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    onMapClick: PropTypes.func,
    markers: PropTypes.array
};

export default MapView;
