import React from 'react';
import PropTypes from 'prop-types';

const FactorBar = ({ label, value, color }) => (
    <div className="mb-3">
        <div className="flex justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-600">{label}</span>
            <span className="text-[11px] font-bold text-slate-900">{value}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
                className={`h-1.5 rounded-full ${color}`}
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
)

FactorBar.propTypes = {
    label: PropTypes.string,
    value: PropTypes.number,
    color: PropTypes.string
}

const RiskFactors = ({ factors }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-full">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Risk Assessment Vectors</h3>

            <FactorBar label="Rainfall Intensity" value={factors.rainfallIntensity} color="bg-blue-500" />
            <FactorBar label="Slope Instability" value={factors.slopeAngle} color="bg-amber-500" />
            <FactorBar label="Vegetation Index (NDVI)" value={factors.vegetation} color="bg-green-500" />
            <FactorBar label="Soil Moisture" value={factors.soilMoisture} color="bg-cyan-500" />
        </div>
    );
};

RiskFactors.propTypes = {
    factors: PropTypes.object
};

export default RiskFactors;
