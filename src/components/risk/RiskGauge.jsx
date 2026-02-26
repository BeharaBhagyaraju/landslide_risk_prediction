import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';

const RiskGauge = ({ value }) => {
    const data = [
        { name: 'Low', value: 30, color: '#10B981' },
        { name: 'Moderate', value: 30, color: '#FBBF24' },
        { name: 'High', value: 25, color: '#F97316' },
        { name: 'Extreme', value: 15, color: '#EF4444' },
    ];

    // Calculate needle angle
    // 0% value = 180 degrees (left), 100% value = 0 degrees (right)
    const angle = 180 - (value / 100) * 180;

    const renderNeedle = (v, data, cx, cy, iR, oR, color) => {
        const x80 = cx + oR * Math.cos(-Math.PI * (v / 180));
        const y80 = cy + oR * Math.sin(-Math.PI * (v / 180));
        return (
            <g>
                <circle cx={cx} cy={cy} r={5} fill="#1e293b" />
                <path d={`M${cx} ${cy} L${x80} ${y80}`} stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
            </g>
        );
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Risk Meter</h3>
            <div className="flex-1 relative flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                        <Pie
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            data={data}
                            cx="50%"
                            cy="100%"
                            innerRadius={65}
                            outerRadius={85}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                            ))}
                        </Pie>
                        <Pie
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            data={[{ value: 100 }]}
                            cx="50%"
                            cy="100%"
                            innerRadius={0}
                            outerRadius={0}
                            stroke="none"
                        >
                            <Cell key="needle" fill="none" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Custom SVG Overlay for the needle */}
                <svg width="100%" height="160" className="absolute top-0 left-0 overflow-visible pointer-events-none">
                    {renderNeedle(angle, data, 107.5, 160, 65, 80, '#1e293b')}
                </svg>

                <div className="mt-2 flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-900 leading-tight">{value}%</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        <div className={`w-1.5 h-1.5 rounded-full ${value > 60 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        Criticality Index
                    </div>
                </div>
            </div>
        </div>
    );
};

RiskGauge.propTypes = {
    value: PropTypes.number.isRequired
};

export default RiskGauge;
