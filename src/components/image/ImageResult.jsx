import React from 'react';
import { ScanSearch, CheckCircle, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const ImageResult = ({ result }) => {
    if (!result) return null;

    const isHighRisk = result.riskLevel === 'High';

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mt-4">
            <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-lg">
                    <ScanSearch className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-slate-900">AI Analysis Complete</h3>
                            <p className="text-xs text-slate-500">Confidence: {result.confidence}%</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isHighRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {result.riskLevel} Risk Detected
                        </span>
                    </div>

                    <div className="mt-4 space-y-2">
                        {result.featuresDetected.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                {isHighRisk ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-200">
                        <span className="font-semibold">Recommendation:</span> {result.recommendation}
                    </div>
                </div>
            </div>
        </div>
    );
};

ImageResult.propTypes = {
    result: PropTypes.object
};

export default ImageResult;
