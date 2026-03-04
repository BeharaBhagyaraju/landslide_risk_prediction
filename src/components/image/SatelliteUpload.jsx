import React, { useState } from 'react';
import { UploadCloud, FileType, CheckCircle2, ScanSearch } from 'lucide-react';
import PropTypes from 'prop-types';

const SatelliteUpload = ({ onUpload, onModelUpload, isAnalyzing }) => {
    const [modelStatus, setModelStatus] = useState(null);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [isDataset, setIsDataset] = useState(false);

    const handleModelChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Handle regular images
            if (file.type.startsWith('image/')) {
                onUpload(file);
                return;
            }

            // Handle H5 files
            setModelStatus('uploading');
            setPreviewImageUrl(null);
            try {
                const result = await onModelUpload(file);

                if (!result) {
                    setModelStatus('error');
                    return;
                }

                setModelStatus('success');
                if (result.isDataset && result.preview) {
                    setIsDataset(true);
                    setPreviewImageUrl(result.preview);
                } else if (result.isDataset && !result.preview) {
                    // Dataset upload succeeded but no extractable image
                    setIsDataset(true);
                } else {
                    setIsDataset(false);
                }
            } catch (err) {
                setModelStatus('error');
            }
        }
    };

    return (
        <div className="space-y-4 w-full text-left">
            <div
                className="relative border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-purple-500 transition-all cursor-pointer bg-slate-50 group overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
            >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <input
                    type="file"
                    id="master-upload"
                    className="hidden"
                    accept=".h5,image/*"
                    onChange={handleModelChange}
                    disabled={isAnalyzing}
                />
                <label htmlFor="master-upload" className="relative cursor-pointer flex flex-col items-center">
                    <div className="bg-white p-5 rounded-2xl shadow-sm mb-5 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                        {modelStatus === 'uploading' ? (
                            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FileType className="w-10 h-10 text-purple-600" />
                        )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg">Upload Dataset or Model</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                        Select an <span className="font-bold text-purple-600">.h5</span> file from Kaggle or a satellite image to begin AI analysis.
                    </p>

                    <div className="mt-6 flex gap-2">
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                            Kaggle H5 Dataset
                        </span>
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                            Keras Model
                        </span>
                    </div>

                    {modelStatus === 'success' && (
                        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight">
                                {isDataset ? 'Dataset Extracted' : 'Model Ready'}
                            </span>
                        </div>
                    )}
                </label>
            </div>

            {/* Custom Model Extraction Status if needed */}
            {previewImageUrl && (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <ScanSearch className="w-4 h-4 text-purple-700" />
                            </div>
                            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Extracted Data Record</h4>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-mono text-slate-500">H5_EXTRACT_001</span>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group">
                        <img
                            src={previewImageUrl}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            alt="Extracted from H5"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] text-white font-bold uppercase tracking-widest border border-white/10 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Tensor Preview
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

SatelliteUpload.propTypes = {
    onUpload: PropTypes.func.isRequired,
    onModelUpload: PropTypes.func.isRequired,
    isAnalyzing: PropTypes.bool
};

export default SatelliteUpload;
