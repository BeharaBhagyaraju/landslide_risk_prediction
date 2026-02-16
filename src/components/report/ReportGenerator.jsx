import React, { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';

const ReportGenerator = () => {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            setGenerating(false);
            alert("Report generated successfully (Mock Download).");
        }, 2000);
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-3 rounded-full mb-3">
                <FileText className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Assessment Report</h3>
            <p className="text-xs text-slate-500 mb-4 px-4">Generate a comprehensive PDF report of the current risk analysis.</p>

            <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors w-full justify-center"
            >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Download Report'}
            </button>
        </div>
    );
};

export default ReportGenerator;
