import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import Papa from 'papaparse';
import PropTypes from 'prop-types';

const HistoricalDataPanel = ({ onDataLoaded, currentCount }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccess(false);

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                setIsUploading(false);
                if (results.errors.length > 0) {
                    setError(`Partial error: ${results.errors[0].message}`);
                    console.error('PapaParse errors:', results.errors);
                }

                // Basic validation and mapping
                const validPoints = results.data.filter(row =>
                    row.lat != null &&
                    row.lng != null &&
                    !isNaN(Number(row.lat)) &&
                    !isNaN(Number(row.lng))
                ).map((row, index) => ({
                    id: row.id || `hist-${index}-${Date.now()}`,
                    lat: Number(row.lat),
                    lng: Number(row.lng),
                    name: row.name || row.location || 'Historical Event',
                    year: row.year || row.date || 'Unknown',
                    severity: row.severity || 'Recorded',
                    description: row.description || `Historical record found at ${row.lat}, ${row.lng}`,
                }));

                if (validPoints.length === 0) {
                    setError('No valid data points (lat/lng) found in the CSV.');
                } else {
                    setSuccess(true);
                    onDataLoaded(validPoints);
                    // Reset success message after a while
                    setTimeout(() => setSuccess(false), 5000);
                }
            },
            error: (err) => {
                setIsUploading(false);
                setError(`Failed to parse file: ${err.message}`);
            }
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-bold text-slate-800">Historical Dataset Management</h2>
                </div>
                {currentCount > 0 && (
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full border border-indigo-100">
                        {currentCount.toLocaleString()} Records Active
                    </span>
                )}
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Upload New Data</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Import a CSV file containing landslide history.
                            Requirements: Columns for <code className="bg-slate-100 px-1 rounded text-slate-800">lat</code> and <code className="bg-slate-100 px-1 rounded text-slate-800">lng</code>.
                        </p>

                        <label className={`
                            relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer
                            transition-all duration-200
                            ${isUploading ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-slate-50/50 border-slate-300 hover:bg-slate-50 hover:border-indigo-400'}
                        `}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className={`w-8 h-8 mb-2 ${isUploading ? 'text-slate-400 animate-pulse' : 'text-slate-500'}`} />
                                <p className="mb-1 text-sm text-slate-600">
                                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-slate-500">CSV file with landslide features (up to 50MB)</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".csv"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>

                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Upload Error</p>
                                    <p className="text-xs text-red-600">{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="ml-auto">
                                    <X className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-800">Success!</p>
                                    <p className="text-xs text-emerald-600">Successfully integrated the dataset into the application.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</h4>
                            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                                <li>Ensure your CSV has headers exactly named <code className="text-indigo-600">lat</code> and <code className="text-indigo-600">lng</code>.</li>
                                <li>Optional columns: <code className="text-indigo-600">name</code>, <code className="text-indigo-600">year</code>, <code className="text-indigo-600">severity</code>, <code className="text-indigo-600">description</code>.</li>
                                <li>The system supports up to 50,000 points without significant lag.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

HistoricalDataPanel.propTypes = {
    onDataLoaded: PropTypes.func.isRequired,
    currentCount: PropTypes.number.isRequired,
};

export default HistoricalDataPanel;
