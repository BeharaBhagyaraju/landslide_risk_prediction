import React from 'react';
import { ScanSearch, CheckCircle, XCircle, AlertTriangle, WifiOff } from 'lucide-react';
import PropTypes from 'prop-types';

const RISK_CONFIG = {
    High: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', Icon: XCircle, label: 'High Risk' },
    Medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', Icon: AlertTriangle, label: 'Medium Risk' },
    Low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', Icon: CheckCircle, label: 'Low Risk' },
};

const ImageResult = ({ result }) => {
    if (!result) return null;

    const cfg = RISK_CONFIG[result.riskLevel] ?? RISK_CONFIG.Low;
    const { Icon } = cfg;
    const isOffline = result.source === 'offline';

    return (
        <div className={`rounded-xl border p-5 ${cfg.border} ${cfg.bg} bg-opacity-30`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-lg shadow-sm">
                        <ScanSearch className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                            Tiny Attention U-Net Analysis
                        </h3>
                        <p className="text-xs text-slate-500">
                            Confidence: <span className="font-semibold">{result.confidence}%</span>
                            {result.landslideAreaPercent != null && (
                                <> · Landslide area: <span className="font-semibold">{result.landslideAreaPercent}%</span></>
                            )}
                        </p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                </span>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-4">
                {result.featuresDetected?.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-white bg-opacity-60 rounded-lg px-3 py-2">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.text}`} />
                        {feature}
                    </div>
                ))}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-white bg-opacity-70 rounded-lg text-sm text-slate-600 border border-slate-200">
                <span className="font-semibold">Recommendation: </span>
                {result.recommendation}
            </div>

            {/* Offline warning */}
            {isOffline && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
                    Backend offline — start the FastAPI server to run real Tiny Attention U-Net inference.
                </div>
            )}
        </div>
    );
};

ImageResult.propTypes = {
    result: PropTypes.shape({
        riskLevel: PropTypes.string,
        confidence: PropTypes.number,
        landslideAreaPercent: PropTypes.number,
        featuresDetected: PropTypes.arrayOf(PropTypes.string),
        recommendation: PropTypes.string,
        source: PropTypes.string,
    }),
};

export default ImageResult;
