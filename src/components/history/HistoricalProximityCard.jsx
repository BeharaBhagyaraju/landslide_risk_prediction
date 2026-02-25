import React from 'react';
import { History, CheckCircle2, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const HistoricalProximityCard = ({ analysis }) => {
    if (!analysis) return null;

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Historical Analysis</h3>

            <div className={`p-4 rounded-lg border ${analysis.isClose ? 'bg-status-warning/10 border-status-warning/20' : 'bg-status-safe/10 border-status-safe/20'}`}>
                <div className="flex items-center gap-3 mb-2">
                    {analysis.isClose ? (
                        <AlertCircle className="w-5 h-5 text-status-warning" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 text-status-safe" />
                    )}
                    <div className="flex flex-col">
                        <span className={`font-bold ${analysis.isClose ? 'text-status-warning' : 'text-status-safe'}`}>
                            {analysis.isClose ? 'Historical Landslide Nearby' : 'No Recent History'}
                        </span>
                        {analysis.isClose && analysis.source && (
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                Source: {analysis.source}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                    {analysis.message}
                </p>
            </div>
        </div>
    );
};

HistoricalProximityCard.propTypes = {
    analysis: PropTypes.object
};

export default HistoricalProximityCard;
