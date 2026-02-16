import React from 'react';
import { AlertTriangle, Droplets, Mountain, Wind } from 'lucide-react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const Card = ({ title, value, unit, icon: Icon, trend, color, status }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
            <div className={clsx("p-2 rounded-lg", color)}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            {status && (
                <span className={clsx("text-xs font-bold px-2 py-1 rounded-full uppercase",
                    status === 'High' ? 'bg-red-100 text-red-700' :
                        status === 'Moderate' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                )}>
                    {status}
                </span>
            )}
        </div>
        <div className="mt-2">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{title}</h4>
            <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                {unit && <span className="text-slate-500 text-sm ml-1">{unit}</span>}
            </div>
        </div>
    </div>
);

Card.propTypes = {
    title: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    unit: PropTypes.string,
    icon: PropTypes.elementType,
    trend: PropTypes.string,
    color: PropTypes.string,
    status: PropTypes.string
};

const RiskCards = ({ riskData }) => {
    if (!riskData) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card
                title="Overall Risk"
                value={riskData.riskLevel}
                icon={AlertTriangle}
                color="bg-status-danger"
            />
            <Card
                title="Environmental Score"
                value={riskData.environmentalScore}
                unit="/ 100"
                icon={Mountain}
                color="bg-status-warning"
            />
            <Card
                title="Soil Saturation"
                value={riskData.factors.soilMoisture}
                unit="%"
                icon={Droplets}
                color="bg-blue-500"
            />
            <Card
                title="Weather Impact"
                value={riskData.weatherScore}
                unit="/ 100"
                icon={Wind}
                color="bg-status-watch"
            />
        </div>
    );
};

RiskCards.propTypes = {
    riskData: PropTypes.object
};

export default RiskCards;
