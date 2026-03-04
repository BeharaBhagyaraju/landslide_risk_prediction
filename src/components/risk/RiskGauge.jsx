import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const RiskGauge = ({ value }) => {
    const data = [
        { name: 'Stable', value: 25, color: '#f5f0f5' },
        { name: 'Watch', value: 25, color: '#e699d6' },
        { name: 'Warning', value: 25, color: '#932093' },
        { name: 'Critical', value: 25, color: '#0a0521' },
    ];

    const angle = 180 - (value / 100) * 180;

    const renderNeedle = (v, cx, cy, len) => {
        const rad = Math.PI * (v / 180);
        const x = cx + len * Math.cos(-rad);
        const y = cy + len * Math.sin(-rad);
        return (
            <g>
                <circle cx={cx} cy={cy} r={8} fill="#0a0521" />
                <path
                    d={`M${cx} ${cy} L${x} ${y}`}
                    stroke="#0a0521"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        );
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 h-full flex flex-col items-center justify-between min-h-[300px]">
            <div className="w-full text-center space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stability Forecast</h3>
                <div className="flex flex-col items-center py-2">
                    <span className="text-6xl font-black text-slate-900 leading-none tracking-tighter tabular-nums drop-shadow-sm">
                        {value}<span className="text-2xl ml-1 opacity-40 font-bold">%</span>
                    </span>
                    <div className={clsx(
                        "mt-3 px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-2",
                        value > 60 ? "bg-red-50 border-red-100 text-red-600" :
                            value > 30 ? "bg-amber-50 border-amber-100 text-amber-600" :
                                "bg-emerald-50 border-emerald-100 text-emerald-600"
                    )}>
                        <div className={clsx("w-2 h-2 rounded-full", value > 60 && "animate-pulse", "bg-current")} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Risk Index</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full max-w-[240px] aspect-[16/9] mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            data={data}
                            cx="50%"
                            cy="100%"
                            innerRadius="75%"
                            outerRadius="100%"
                            stroke="#fff"
                            strokeWidth={3}
                            isAnimationActive={true}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 pointer-events-none">
                    {/* Adjusted viewBox to match 100% height relative to width */}
                    <svg viewBox="0 0 240 135" width="100%" height="100%" className="overflow-visible">
                        {/* Needle at Bottom Center (120, 135) pointing upwards */}
                        {renderNeedle(angle, 120, 135, 95)}
                    </svg>
                </div>
            </div>

            <div className="w-full grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-50">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="w-full h-1.5 rounded-full mb-1.5" style={{ backgroundColor: d.color, opacity: 0.3 }} />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{d.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

RiskGauge.propTypes = {
    value: PropTypes.number.isRequired
};

export default RiskGauge;
