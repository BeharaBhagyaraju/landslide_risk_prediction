import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import PropTypes from 'prop-types';

const SatelliteUpload = ({ onUpload, isAnalyzing }) => {
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    return (
        <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <input
                type="file"
                id="satellite-upload"
                className="hidden"
                accept="image/*"
                onChange={handleChange}
                disabled={isAnalyzing}
            />
            <label htmlFor="satellite-upload" className="cursor-pointer flex flex-col items-center">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <UploadCloud className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-slate-900">Upload Satellite Imagery</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    Drag & drop or click to upload drone/satellite imagery for AI topography analysis.
                </p>
            </label>
        </div>
    );
};

SatelliteUpload.propTypes = {
    onUpload: PropTypes.func.isRequired,
    isAnalyzing: PropTypes.bool
};

export default SatelliteUpload;
