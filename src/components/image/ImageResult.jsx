import React from 'react';
import { ScanSearch, CheckCircle, XCircle, AlertTriangle, WifiOff } from 'lucide-react';
import PropTypes from 'prop-types';

const RISK_CONFIG = {
    High: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', Icon: XCircle, label: 'High Risk' },
    Medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', Icon: AlertTriangle, label: 'Medium Risk' },
    Low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', Icon: CheckCircle, label: 'Low Risk' },
};

const ImageResult = ({ result, originalImage }) => {
    if (!result) return null;

    const cfg = RISK_CONFIG[result.riskLevel] ?? RISK_CONFIG.Low;
    const { Icon } = cfg;
    const isOffline = result.source === 'offline';

    return (
        <div className={`rounded-xl border p-5 ${cfg.border} ${cfg.bg} bg-opacity-30 flex flex-col gap-4`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-lg shadow-sm">
                        <ScanSearch className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-900 text-sm">
                            Landslide Analysis Map
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                            AI Visual Segmentation
                        </p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                </span>
            </div>

            {/* Visual Overlay */}
            {(originalImage || result.maskBase64) && (
                <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner group">
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100">
                        Analyzing Pixels...
                    </div>
                    {originalImage && (
                        <img
                            src={originalImage}
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                            alt="Original Satellite"
                        />
                    )}
                    {result.maskBase64 && (
                        <img
                            src={result.maskBase64}
                            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80 animate-pulse-slow"
                            alt="Prediction Mask"
                        />
                    )}

                    {/* Overlay Label */}
                    <div className="absolute bottom-3 left-3 flex gap-2">
                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] text-white font-bold uppercase tracking-widest border border-white/10">
                            Satellite View
                        </div>
                        {result.maskBase64 && (
                            <div className="bg-pink-600/80 backdrop-blur-md px-2 py-1 rounded text-[8px] text-white font-bold uppercase tracking-widest border border-pink-400/20">
                                AI Landslide Mask
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Features */}
            <div className="space-y-2">
                {result.featuresDetected?.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 bg-white bg-opacity-60 rounded-lg px-3 py-2 border border-slate-100">
                        <div className={`p-1 rounded-md ${cfg.bg}`}>
                            <Icon className={`w-3 h-3 ${cfg.text}`} />
                        </div>
                        {feature}
                    </div>
                ))}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-white bg-opacity-70 rounded-lg text-xs text-slate-600 border border-slate-200 text-left">
                <span className="font-bold text-slate-900 uppercase text-[9px] tracking-tight block mb-1">AI Recommendation</span>
                {result.recommendation}
            </div>

            {/* Offline warning */}
            {isOffline && (
                <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
                    Backend offline — Using fallback analysis.
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
