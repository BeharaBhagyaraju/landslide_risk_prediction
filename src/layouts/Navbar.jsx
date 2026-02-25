import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, History, Map as MapIcon, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

const Navbar = () => {
    const navLinkClass = ({ isActive }) =>
        clsx(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium",
            isActive
                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        );

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                                LandslideWatch
                            </h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                AI Early Warning System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
