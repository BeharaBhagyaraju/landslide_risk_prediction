import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';

const RiskGauge = ({ value }) => {
    const data = [
        { value: value },
        { value: 100 - value }
    ];

    // Determine color based on value
    const getColor = (val) => {
        if (val < 40) return '#10B981'; // Green
        if (val < 70) return '#FBBF24'; // Yellow
        if (val < 85) return '#F97316'; // Orange
        return '#EF4444'; // Red
    };

    const activeColor = getColor(value);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Risk Meter</h3>
            <div className="h-40 relative flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="val" fill={activeColor} />
                            <Cell key="rem" fill="#f1f5f9" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-900">{value}%</span>
                    <span className="text-xs text-slate-400 font-medium">CRITICALITY</span>
                </div>
            </div>
        </div>
    );
};

RiskGauge.propTypes = {
    value: PropTypes.number.isRequired
};

export default RiskGauge;
