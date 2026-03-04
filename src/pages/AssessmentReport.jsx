import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FileText, Download, Loader2,
    MapPin, Calendar, ShieldAlert, Activity,
    Droplets, Mountain, Wind, TrendingUp, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getAssessmentById } from '../services/predictionService';

// ── helpers ───────────────────────────────────────────────────────────────────
const RISK_CONFIG = {
    High: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: AlertTriangle },
    Medium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle },
    Low: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
};

function getRiskConfig(level) {
    return RISK_CONFIG[level] || RISK_CONFIG['Low'];
}

function ScoreBar({ label, value, color = 'bg-blue-500' }) {
    const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
    return (
        <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="font-medium">{label}</span>
                <span className="font-bold">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, accent }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
            <div className={`p-1.5 rounded-md ${accent || 'bg-slate-100'}`}>
                <Icon className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{value ?? '—'}</p>
            </div>
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────────
const AssessmentReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [generating, setPdfGenerating] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getAssessmentById(id);
            if (!data) {
                setNotFound(true);
            } else {
                setRecord(data);
            }
            setLoading(false);
        })();
    }, [id]);

    const handleExportPDF = () => {
        if (!record) return;
        setPdfGenerating(true);
        try {
            const doc = new jsPDF();
            const f = record.details || {};
            const ts = new Date().toLocaleString();

            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42);
            doc.text('LANDSLIDE PREDICTION REPORT', 20, 25);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated: ${ts}`, 20, 32);
            doc.text(`Assessment ID: ${record.id}`, 20, 37);
            doc.text(`Location: ${record.location}`, 20, 42);
            doc.text(`Coordinates: ${record.coordinates}`, 20, 47);
            doc.text(`Date of Assessment: ${record.date}`, 20, 52);

            doc.setDrawColor(226, 232, 240);
            doc.line(20, 58, 190, 58);

            doc.setFontSize(14); doc.setTextColor(15, 23, 42);
            doc.text('1. RISK ASSESSMENT SUMMARY', 20, 68);
            doc.setFontSize(11);
            doc.text(`Risk Level: ${record.riskLevel}`, 25, 78);
            doc.text(`Confidence Score: ${((record.confidence || 0)).toFixed(1)}%`, 25, 85);
            doc.text(`Environmental Score: ${(f.environmentalScore || 0).toFixed(1)}%`, 25, 92);
            doc.text(`Weather Score: ${(f.weatherScore || 0).toFixed(1)}%`, 25, 99);

            doc.setFontSize(14); doc.setTextColor(15, 23, 42);
            doc.text('2. ENVIRONMENTAL FACTORS', 20, 113);
            doc.setFontSize(11);
            const factors = f.factors || {};
            let y = 123;
            const factorEntries = Object.entries(factors);
            if (factorEntries.length > 0) {
                factorEntries.forEach(([k, v]) => {
                    doc.text(`${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`, 25, y);
                    y += 7;
                });
            } else {
                doc.text('No individual factor data available.', 25, y);
                y += 7;
            }

            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('Confidential – Generated by LandslideWatch AI Platform', 20, 280);

            doc.save(`LandslideReport_${record.id}.pdf`);
        } catch (e) {
            console.error('PDF failed', e);
            alert('PDF generation failed. Please try again.');
        } finally {
            setPdfGenerating(false);
        }
    };

    // ── States ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-slate-500 gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading assessment report...
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
                <h2 className="text-xl font-bold text-slate-700">Report Not Found</h2>
                <p className="text-slate-500 text-sm">This assessment record doesn't exist or may have been deleted.</p>
                <button
                    onClick={() => navigate('/history')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to History
                </button>
            </div>
        );
    }

    const cfg = getRiskConfig(record.riskLevel);
    const RiskIcon = cfg.icon;
    const details = record.details || {};
    const factors = details.factors || {};
    const envScore = Number(details.environmentalScore || 0);
    const weatherScore = Number(details.weatherScore || 0);
    const confidence = Number(record.confidence || 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* ── Top bar ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <button
                    onClick={() => navigate('/history')}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Assessment History
                </button>
                <button
                    onClick={handleExportPDF}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {generating ? 'Exporting...' : 'Export PDF'}
                </button>
            </div>

            {/* ── Hero risk banner ───────────────────────────────────────── */}
            <div className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${cfg.badge.replace('text-', 'bg-').split(' ')[0]} bg-white/60`}>
                            <RiskIcon className="w-7 h-7 text-current" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                                Landslide Risk Assessment Report
                            </p>
                            <h1 className="text-2xl font-extrabold text-slate-900">{record.location}</h1>
                            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {record.coordinates}
                            </p>
                        </div>
                    </div>
                    <div className="text-center sm:text-right">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${cfg.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            {record.riskLevel} Risk
                        </span>
                        <p className="text-xs text-slate-500 mt-2 flex items-center justify-center sm:justify-end gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {record.date}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Main grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Score overview */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Risk Scores</h2>
                    </div>
                    <ScoreBar label="Model Confidence" value={confidence} color="bg-purple-500" />
                    <ScoreBar label="Environmental Risk Score" value={envScore} color="bg-orange-500" />
                    <ScoreBar label="Weather Risk Score" value={weatherScore} color="bg-blue-500" />

                    {/* Factor breakdown */}
                    {Object.keys(factors).length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Contributing Factors
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(factors).map(([key, val]) => (
                                    <div key={key} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                        <p className="text-base font-bold text-slate-800 mt-0.5">
                                            {typeof val === 'number' ? val.toFixed(1) : String(val)}
                                            {key.toLowerCase().includes('angle') || key.toLowerCase().includes('slope') ? '°' :
                                                key.toLowerCase().includes('moisture') || key.toLowerCase().includes('score') ||
                                                    key.toLowerCase().includes('percent') ? '%' : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Metadata sidebar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Assessment Details</h2>
                    </div>
                    <div className="mt-2">
                        <InfoRow icon={Calendar} label="Date" value={record.date} />
                        <InfoRow icon={MapPin} label="Location" value={record.location} />
                        <InfoRow icon={TrendingUp} label="Confidence" value={`${confidence.toFixed(1)}%`} />
                        <InfoRow icon={ShieldAlert} label="Risk Level" value={record.riskLevel} />
                        {factors.soilMoisture != null && (
                            <InfoRow icon={Droplets} label="Soil Moisture" value={`${Number(factors.soilMoisture).toFixed(1)}%`} />
                        )}
                        {factors.slopeAngle != null && (
                            <InfoRow icon={Mountain} label="Slope Angle" value={`${Number(factors.slopeAngle).toFixed(1)}°`} />
                        )}
                        {factors.windSpeed != null && (
                            <InfoRow icon={Wind} label="Wind Speed" value={`${Number(factors.windSpeed).toFixed(1)} km/h`} />
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                        Assessment ID: <span className="font-mono">{record.id}</span>
                    </p>
                </div>
            </div>

            {/* ── Recommendation footer ──────────────────────────────────── */}
            <div className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recommendation</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {record.riskLevel === 'High'
                        ? '⚠️ Immediate geotechnical inspection is strongly recommended. Avoid the site until assessed by a qualified professional. Alert local emergency services if population is nearby.'
                        : record.riskLevel === 'Medium'
                            ? '🔔 Elevated risk detected. Continue enhanced monitoring and restrict access to steep slopes. Review emergency evacuation routes and keep first responders on standby.'
                            : '✅ No immediate action required. Maintain standard monitoring protocols and re-assess following significant rainfall or seismic events.'}
                </p>
            </div>
        </div>
    );
};

export default AssessmentReport;
