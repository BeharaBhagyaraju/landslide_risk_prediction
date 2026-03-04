import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryTable from '../components/history/HistoryTable';
import { fetchAssessmentHistory, deleteAssessment } from '../services/predictionService';
import { Clock, Filter, ChevronDown } from 'lucide-react';

// ── Filter definitions ────────────────────────────────────────────────────────
const TIME_FILTERS = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: 'week' },
    { label: 'Last Month', value: 'month' },
];

const RISK_OPTIONS = ['All Risks', 'High', 'Medium', 'Low'];

function isWithinRange(record, timeFilter) {
    if (timeFilter === 'all') return true;

    // Use the ISO createdAt if available, otherwise try to parse the readable date
    const raw = record.createdAt || record.date || '';
    const ts = new Date(raw);
    if (isNaN(ts.getTime())) return true; // Old records without timestamp — include them

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeFilter === 'today') {
        return ts >= startOfToday;
    }
    if (timeFilter === 'week') {
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() - 7);
        return ts >= cutoff;
    }
    if (timeFilter === 'month') {
        const cutoff = new Date(now);
        cutoff.setMonth(now.getMonth() - 1);
        return ts >= cutoff;
    }
    return true;
}

// ── Component ─────────────────────────────────────────────────────────────────
const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState('All Risks');
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await fetchAssessmentHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ── Filtered records (memoised) ───────────────────────────────────────────
    const filteredHistory = useMemo(() => {
        return history.filter((record) => {
            const timeOk = isWithinRange(record, timeFilter);
            const riskOk =
                riskFilter === 'All Risks' ||
                (record.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();
            return timeOk && riskOk;
        });
    }, [history, timeFilter, riskFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assessment record?')) return;
        const result = await deleteAssessment(id);
        if (result.status === 'success') {
            fetchData();
        } else {
            alert('Failed to delete assessment.');
        }
    };

    const handleViewReport = (record) => {
        navigate(`/report/${record.id}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Clock className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Assessment History</h1>
                        <p className="text-slate-500 text-sm">
                            Archive of past risk assessments and generated reports.
                            {!loading && (
                                <span className="ml-2 font-medium text-slate-700">
                                    ({filteredHistory.length} of {history.length} records)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
                {/* Icon + label */}
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium shrink-0">
                    <Filter className="w-4 h-4" />
                    Filter by:
                </div>

                {/* Time period pills */}
                <div className="flex flex-wrap gap-2">
                    {TIME_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setTimeFilter(f.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${timeFilter === f.value
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-6 bg-slate-200" />

                {/* Risk level dropdown */}
                <div className="relative">
                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer transition-all"
                    >
                        {RISK_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Reset link */}
                {(timeFilter !== 'all' || riskFilter !== 'All Risks') && (
                    <button
                        onClick={() => { setTimeFilter('all'); setRiskFilter('All Risks'); }}
                        className="text-xs text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors ml-auto"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            {/* ── Table ───────────────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading history records...</div>
            ) : filteredHistory.length === 0 && history.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-500">
                    No records match the selected filters.
                    <button
                        onClick={() => { setTimeFilter('all'); setRiskFilter('All Risks'); }}
                        className="mt-3 block mx-auto text-sm text-blue-600 underline hover:text-blue-800"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <HistoryTable
                    history={filteredHistory}
                    onDelete={handleDelete}
                    onViewReport={handleViewReport}
                />
            )}
        </div>
    );
};

export default History;
