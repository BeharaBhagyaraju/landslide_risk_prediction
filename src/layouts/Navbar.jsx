import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, History, Map as MapIcon, ShieldAlert, Menu, X, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { userEmail, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClass = ({ isActive }) =>
        clsx(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium w-full md:w-auto",
            isActive
                ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
        );

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="border-b border-white/10 sticky top-0 z-50 shadow-xl" style={{ backgroundColor: 'var(--color-navy)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--color-purple)' }}>
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                                LandslideWatch
                            </h1>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                AI Early Warning System
                            </p>
                        </div>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-2">
                        <NavLink to="/" className={navLinkClass}>
                            <Activity className="w-4 h-4" />
                            Dashboard
                        </NavLink>
                        <NavLink to="/history" className={navLinkClass}>
                            <History className="w-4 h-4" />
                            Assessment History
                        </NavLink>
                        <NavLink to="/events" className={navLinkClass}>
                            <MapIcon className="w-4 h-4" />
                            Historical Events
                        </NavLink>

                        {/* User + Logout */}
                        <div className="flex items-center gap-2 ml-3 pl-3 border-l border-white/10">
                            {userEmail && (
                                <span className="text-xs text-slate-400 max-w-[140px] truncate hidden lg:block">{userEmail}</span>
                            )}
                            <button
                                onClick={handleLogout}
                                title="Sign out"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden lg:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="p-2 rounded-md text-slate-300 hover:bg-white/10 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Content */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-white/5 px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top duration-200" style={{ backgroundColor: 'var(--color-navy)' }}>
                    <NavLink to="/" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
                        <Activity className="w-4 h-4" />
                        Dashboard
                    </NavLink>
                    <NavLink to="/history" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
                        <History className="w-4 h-4" />
                        Assessment History
                    </NavLink>
                    <NavLink to="/events" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
                        <MapIcon className="w-4 h-4" />
                        Historical Events
                    </NavLink>
                    <button
                        onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium w-full text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                    {userEmail && (
                        <p className="text-xs text-slate-500 px-4 pt-1">{userEmail}</p>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
