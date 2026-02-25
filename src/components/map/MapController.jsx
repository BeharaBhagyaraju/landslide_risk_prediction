import { useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';

const MapController = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            if (onMapClick) {
                onMapClick(e.latlng);
            }
        },
    });
    return null;
};

MapController.propTypes = {
    onMapClick: PropTypes.func
};

export default MapController;
