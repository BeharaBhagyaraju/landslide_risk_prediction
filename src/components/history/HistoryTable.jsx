import React from 'react';
import PropTypes from 'prop-types';
import { Trash2 } from 'lucide-react';

const HistoryTable = ({ history, onDelete, onViewReport }) => {
    if (!history || history.length === 0) {
        return <div className="p-8 text-center text-slate-500">No assessment history found.</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Coordinates</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Level</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {history.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{record.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono hidden md:table-cell">{record.coordinates}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${record.riskLevel === 'High' || record.riskLevel === 'High Alert' ? 'bg-red-100 text-red-800' :
                                        record.riskLevel === 'Medium' || record.riskLevel === 'Warning' ? 'bg-amber-100 text-amber-800' :
                                            record.riskLevel === 'Low' || record.riskLevel === 'Watch' || record.riskLevel === 'Stable' ? 'bg-emerald-100 text-emerald-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                    {record.riskLevel}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                                <button
                                    onClick={() => onViewReport && onViewReport(record)}
                                    className="text-blue-600 hover:text-blue-900 cursor-pointer"
                                >
                                    View Report
                                </button>
                                <button
                                    onClick={() => onDelete(record.id)}
                                    className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Delete Record"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

HistoryTable.propTypes = {
    history: PropTypes.array,
    onDelete: PropTypes.func,
    onViewReport: PropTypes.func,
};

export default HistoryTable;
