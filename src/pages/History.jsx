import React, { useEffect, useState } from 'react';
import HistoryTable from '../components/history/HistoryTable';
import { getRiskAssessmentHistory } from '../services/mockRiskService';
import { Clock } from 'lucide-react';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getRiskAssessmentHistory();
                setHistory(data);
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Assessment History</h1>
                    <p className="text-slate-500">Archive of past risk assessments and generated reports.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading history records...</div>
            ) : (
                <HistoryTable history={history} />
            )}
        </div>
    );
};

export default History;
