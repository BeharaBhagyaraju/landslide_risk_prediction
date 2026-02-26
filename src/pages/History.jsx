import React, { useEffect, useState } from 'react';
import HistoryTable from '../components/history/HistoryTable';
import { fetchAssessmentHistory, deleteAssessment } from '../services/predictionService';
import { Clock } from 'lucide-react';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const data = await fetchAssessmentHistory();
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assessment record?')) return;

        const result = await deleteAssessment(id);
        if (result.status === 'success') {
            fetchData(); // Refresh list
        } else {
            alert('Failed to delete assessment.');
        }
    };

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
                <HistoryTable history={history} onDelete={handleDelete} />
            )}
        </div>
    );
};

export default History;
