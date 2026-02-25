import React from 'react';
import { CloudRain, Thermometer, Droplets, Wind } from 'lucide-react';
import PropTypes from 'prop-types';

const WeatherPanel = ({ weather }) => {
    if (!weather) return null;

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Live Weather Conditions</h3>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <CloudRain className="w-10 h-10 text-blue-500" />
                    <div>
                        <div className="text-3xl font-bold text-slate-900">{weather.temp}°C</div>
                        <div className="text-sm text-slate-500">{weather.condition}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400">7-Day Total</div>
                    <div className="font-semibold text-blue-600">{weather.total7DayRain}mm</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    <div>
                        <div className="text-xs text-slate-400">Humidity</div>
                        <div className="font-semibold text-slate-700">{weather.humidity}%</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Wind className="w-4 h-4 text-slate-500" />
                    <div>
                        <div className="text-xs text-slate-400">Wind</div>
                        <div className="font-semibold text-slate-700">{weather.windSpeed} km/h</div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-400 mb-2">7-Day Rainfall History</h4>
                <div className="flex justify-between overflow-x-auto gap-2 pb-1 scrollbar-hide">
                    {weather.rainfallHistory?.map((day, idx) => (
                        <div key={idx} className="text-center min-w-[35px]">
                            <div className="text-[10px] text-slate-500 mb-1">
                                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </div>
                            <div className={`text-xs font-bold ${day.precip > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                {day.precip}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

WeatherPanel.propTypes = {
    weather: PropTypes.object
};

export default WeatherPanel;
