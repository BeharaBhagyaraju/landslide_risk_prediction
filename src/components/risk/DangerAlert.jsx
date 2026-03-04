import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X, ShieldAlert, PhoneCall, ArrowRight } from 'lucide-react';

/**
 * DangerAlert — Full-screen overlay modal shown when a High risk is detected.
 * source: 'manual'          → triggered by "Assess Risk" button
 * source: 'auto-hourly'     → triggered by the scheduled hourly GPS check
 * source: 'auto-location'   → triggered when user moves ≥1 km into a new area
 */
const ALERT_CONTENT = {
    manual: {
        badge: '⚠ DANGER',
        title: 'HIGH LANDSLIDE RISK DETECTED',
        subtitle: 'Immediate caution is advised. This area shows critical risk indicators.',
        locationLabel: 'Assessed Location',
    },
    'auto-hourly': {
        badge: '⏰ SCHEDULED ALERT',
        title: 'HIGH RISK AT YOUR LOCATION',
        subtitle: 'Our hourly safety check found critical landslide risk at your current GPS position.',
        locationLabel: 'Your Current Location',
    },
    'auto-location': {
        badge: '📍 LOCATION ALERT',
        title: 'YOU HAVE ENTERED A HIGH-RISK ZONE',
        subtitle: 'You have moved into an area with critical landslide risk. Take immediate precautions.',
        locationLabel: 'Detected Location',
    },
};

const DangerAlert = ({ show, riskData, location, onClose, source = 'manual' }) => {
    const audioRef = useRef(null);

    // Play warning sound when modal opens
    useEffect(() => {
        if (!show) return;

        // Use the Web Audio API to generate a warning beep sequence
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const playBeep = (startTime, freq = 880, duration = 0.15) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            const t = ctx.currentTime;
            playBeep(t, 880, 0.18);
            playBeep(t + 0.22, 660, 0.18);
            playBeep(t + 0.44, 880, 0.18);
            playBeep(t + 0.66, 660, 0.28);
        } catch {
            // silently ignore if audio is blocked
        }
    }, [show]);

    // Prevent body scroll while modal is open
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [show]);

    if (!show || !riskData) return null;

    const overallRisk = riskData.overallRisk ?? riskData.riskScore ?? 0;
    const factors = riskData.factors ?? {};
    const content = ALERT_CONTENT[source] ?? ALERT_CONTENT.manual;

    return (
        <div
            className="danger-alert-backdrop"
            role="alertdialog"
            aria-modal="true"
            aria-label="High Landslide Risk Warning"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Pulsing red vignette overlay */}
            <div className="danger-alert-vignette" />

            <div className="danger-alert-modal">
                {/* Close button */}
                <button
                    className="danger-alert-close"
                    onClick={onClose}
                    aria-label="Dismiss alert"
                >
                    <X size={20} />
                </button>

                {/* Icon + Header */}
                <div className="danger-alert-header">
                    <div className="danger-alert-icon-ring">
                        <ShieldAlert className="danger-alert-icon" />
                    </div>
                    <div className="danger-alert-badge">{content.badge}</div>
                </div>

                <h2 className="danger-alert-title">{content.title}</h2>
                <p className="danger-alert-subtitle">{content.subtitle}</p>

                {/* Coordinates */}
                <div className="danger-alert-location">
                    <span className="danger-alert-location-label">{content.locationLabel}</span>
                    <span className="danger-alert-location-coords">
                        {location?.lat?.toFixed(4) ?? '--'}°N, {location?.lng?.toFixed(4) ?? '--'}°E
                    </span>
                </div>

                {/* Risk Score Bar */}
                <div className="danger-alert-score-section">
                    <div className="danger-alert-score-header">
                        <span>Risk Score</span>
                        <span className="danger-alert-score-value">{overallRisk}%</span>
                    </div>
                    <div className="danger-alert-bar-track">
                        <div
                            className="danger-alert-bar-fill"
                            style={{ width: `${Math.min(overallRisk, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Key Risk Indicators */}
                <div className="danger-alert-factors">
                    <FactorRow label="Rainfall (7-day)" value={`${factors.rainfall ?? '--'} mm`} />
                    <FactorRow label="Soil Moisture" value={`${factors.soilMoisture ?? '--'}%`} />
                    <FactorRow label="Slope" value={`${factors.slope ?? '--'}°`} />
                    <FactorRow label="Elevation" value={`${factors.elevation ?? '--'} m`} />
                </div>

                {/* Safety Instructions */}
                <div className="danger-alert-instructions">
                    <p className="danger-alert-instructions-title">
                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
                        Recommended Safety Actions
                    </p>
                    <ul className="danger-alert-instructions-list">
                        <li><ArrowRight size={12} className="danger-alert-arrow" /> Evacuate steep slopes and hillside areas immediately</li>
                        <li><ArrowRight size={12} className="danger-alert-arrow" /> Avoid river valleys and low-lying drainage areas</li>
                        <li><ArrowRight size={12} className="danger-alert-arrow" /> Do not drive on mountain or unpaved roads</li>
                        <li><ArrowRight size={12} className="danger-alert-arrow" /> Monitor local emergency broadcasts</li>
                    </ul>
                </div>

                {/* Emergency CTA */}
                <div className="danger-alert-cta">
                    <a href="tel:112" className="danger-alert-cta-btn">
                        <PhoneCall size={16} />
                        Emergency: 112
                    </a>
                    <button className="danger-alert-dismiss-btn" onClick={onClose}>
                        I Understand — Dismiss
                    </button>
                </div>
            </div>

            <style>{`
                .danger-alert-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(10, 0, 0, 0.82);
                    backdrop-filter: blur(6px);
                    animation: dangerFadeIn 0.3s ease;
                    padding: 16px;
                }

                @keyframes dangerFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                .danger-alert-vignette {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    border: 0 solid transparent;
                    box-shadow: inset 0 0 120px 40px rgba(220, 38, 38, 0.35);
                    animation: dangerPulse 1.6s ease-in-out infinite;
                    z-index: 10000;
                }

                @keyframes dangerPulse {
                    0%, 100% { box-shadow: inset 0 0 120px 40px rgba(220, 38, 38, 0.25); }
                    50%       { box-shadow: inset 0 0 160px 60px rgba(220, 38, 38, 0.5); }
                }

                .danger-alert-modal {
                    position: relative;
                    z-index: 10001;
                    background: linear-gradient(160deg, #1a0505 0%, #2d0a0a 50%, #1a0505 100%);
                    border: 1px solid rgba(220, 38, 38, 0.6);
                    border-radius: 20px;
                    padding: 32px 28px 24px;
                    max-width: 520px;
                    width: 100%;
                    box-shadow:
                        0 0 0 1px rgba(220, 38, 38, 0.3),
                        0 25px 80px rgba(0,0,0,0.8),
                        0 0 60px rgba(220, 38, 38, 0.2);
                    animation: dangerModalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes dangerModalIn {
                    from { transform: scale(0.85) translateY(20px); opacity: 0; }
                    to   { transform: scale(1) translateY(0); opacity: 1; }
                }

                .danger-alert-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(220, 38, 38, 0.15);
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    border-radius: 8px;
                    color: #fca5a5;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .danger-alert-close:hover {
                    background: rgba(220, 38, 38, 0.35);
                    color: white;
                }

                .danger-alert-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 16px;
                }

                .danger-alert-icon-ring {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: rgba(220, 38, 38, 0.2);
                    border: 2px solid rgba(220, 38, 38, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: iconPing 1.4s ease-in-out infinite;
                    flex-shrink: 0;
                }

                @keyframes iconPing {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
                    60%      { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
                }

                .danger-alert-icon {
                    width: 28px;
                    height: 28px;
                    color: #f87171;
                }

                .danger-alert-badge {
                    background: rgba(220, 38, 38, 0.25);
                    border: 1px solid rgba(220, 38, 38, 0.5);
                    color: #fca5a5;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.15em;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-family: monospace;
                }

                .danger-alert-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: 0.04em;
                    margin: 0 0 6px 0;
                    line-height: 1.2;
                }

                .danger-alert-subtitle {
                    font-size: 13px;
                    color: #fca5a5;
                    margin: 0 0 18px 0;
                    line-height: 1.5;
                }

                .danger-alert-location {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(220, 38, 38, 0.2);
                    border-radius: 10px;
                    padding: 10px 14px;
                    margin-bottom: 18px;
                }

                .danger-alert-location-label {
                    font-size: 11px;
                    color: #9ca3af;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .danger-alert-location-coords {
                    font-size: 13px;
                    color: #f87171;
                    font-family: monospace;
                    font-weight: 700;
                }

                .danger-alert-score-section {
                    margin-bottom: 18px;
                }

                .danger-alert-score-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #9ca3af;
                    font-weight: 600;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .danger-alert-score-value {
                    color: #f87171;
                    font-weight: 800;
                }

                .danger-alert-bar-track {
                    height: 8px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 99px;
                    overflow: hidden;
                }

                .danger-alert-bar-fill {
                    height: 100%;
                    border-radius: 99px;
                    background: linear-gradient(90deg, #ef4444, #dc2626, #b91c1c);
                    box-shadow: 0 0 12px rgba(220, 38, 38, 0.6);
                    transition: width 0.6s ease;
                }

                .danger-alert-factors {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 18px;
                }

                .danger-factor-row {
                    display: flex;
                    flex-direction: column;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 8px;
                    padding: 8px 12px;
                }

                .danger-factor-label {
                    font-size: 10px;
                    color: #6b7280;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    margin-bottom: 2px;
                }

                .danger-factor-value {
                    font-size: 14px;
                    color: #fca5a5;
                    font-weight: 700;
                    font-family: monospace;
                }

                .danger-alert-instructions {
                    background: rgba(220, 38, 38, 0.08);
                    border: 1px solid rgba(220, 38, 38, 0.2);
                    border-radius: 10px;
                    padding: 14px;
                    margin-bottom: 20px;
                }

                .danger-alert-instructions-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: #fca5a5;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin: 0 0 10px 0;
                    display: flex;
                    align-items: center;
                }

                .danger-alert-instructions-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .danger-alert-instructions-list li {
                    font-size: 12px;
                    color: #e5e7eb;
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                    line-height: 1.4;
                }

                .danger-alert-arrow {
                    color: #f87171;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .danger-alert-cta {
                    display: flex;
                    gap: 10px;
                }

                .danger-alert-cta-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #dc2626;
                    color: white;
                    font-size: 13px;
                    font-weight: 700;
                    padding: 10px 16px;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    text-decoration: none;
                    transition: background 0.2s;
                    white-space: nowrap;
                }

                .danger-alert-cta-btn:hover {
                    background: #b91c1c;
                }

                .danger-alert-dismiss-btn {
                    flex: 1;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #d1d5db;
                    font-size: 13px;
                    font-weight: 600;
                    padding: 10px 16px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .danger-alert-dismiss-btn:hover {
                    background: rgba(255,255,255,0.12);
                    color: white;
                }
            `}</style>
        </div>
    );
};

const FactorRow = ({ label, value }) => (
    <div className="danger-factor-row">
        <span className="danger-factor-label">{label}</span>
        <span className="danger-factor-value">{value}</span>
    </div>
);

FactorRow.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string
};

DangerAlert.propTypes = {
    show: PropTypes.bool.isRequired,
    riskData: PropTypes.object,
    location: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
    onClose: PropTypes.func.isRequired,
    source: PropTypes.oneOf(['manual', 'auto-hourly', 'auto-location']),
};

export default DangerAlert;
