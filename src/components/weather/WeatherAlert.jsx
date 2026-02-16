import React from 'react';
import { AlertOctagon } from 'lucide-react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const WeatherAlert = ({ alert }) => {
    if (!alert) return null;

    const colorStyles = alert.severity === 'red' ? 'bg-red-50 text-red-800 border-red-200' :
        alert.severity === 'orange' ? 'bg-orange-50 text-orange-800 border-orange-200' :
            'bg-yellow-50 text-yellow-800 border-yellow-200';

    return (
        <div className={clsx("p-4 rounded-xl border flex items-start gap-3 mt-4", colorStyles)}>
            <AlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-bold text-sm uppercase mb-1">Weather Warning</h4>
                <p className="text-sm leading-relaxed opacity-90">{alert.message}</p>
            </div>
        </div>
    );
};

WeatherAlert.propTypes = {
    alert: PropTypes.object
};

export default WeatherAlert;
