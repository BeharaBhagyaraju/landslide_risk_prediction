import React from 'react';
import PropTypes from 'prop-types';

const HistoryTable = ({ history }) => {
    if (!history || history.length === 0) {
        return <div className="p-8 text-center text-slate-500">No assessment history found.</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Coordinates</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Level</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {history.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{record.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{record.coordinates}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${record.riskLevel === 'High Alert' ? 'bg-red-100 text-red-800' :
                                        record.riskLevel === 'Warning' ? 'bg-orange-100 text-orange-800' :
                                            record.riskLevel === 'Watch' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'}`}>
                                    {record.riskLevel}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900 cursor-pointer font-medium">
                                View Report
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

HistoryTable.propTypes = {
    history: PropTypes.array
};

export default HistoryTable;
