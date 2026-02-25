import React from 'react';
import Navbar from './Navbar';
import PropTypes from 'prop-types'; // Added for professional proptypes

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            <footer className="bg-white border-t border-slate-200 mt-auto py-6">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} LandslideWatch AI System. Authorized Personnel Only.
                </div>
            </footer>
        </div>
    );
};

Layout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Layout;
