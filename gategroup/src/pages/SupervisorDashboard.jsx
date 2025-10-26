import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3001';

export default function SupervisorDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/metrics/dashboard`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
                    <p className="text-white mt-4 text-lg">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-md">
                    <h2 className="text-red-400 text-xl font-bold mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-6 rounded-lg transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { productivity, errorRates, efficiency } = dashboardData || {};

    return (
        <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            Supervisor <span className="text-amber-400">Dashboard</span>
                        </h1>
                        <p className="text-gray-400">Welcome, {user?.fullName || user?.username}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/home')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all"
                        >
                            Back to Home
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Overall Efficiency Metrics */}
                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                    <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Overall Line Efficiency
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <MetricCard
                            label="Total Employees"
                            value={efficiency?.totalEmployees || 0}
                            icon="👥"
                        />
                        <MetricCard
                            label="Drawers Completed"
                            value={efficiency?.totalDrawersCompleted || 0}
                            icon="📦"
                        />
                        <MetricCard
                            label="Avg Drawers/Hour"
                            value={(efficiency?.avgDrawersPerHour || 0).toFixed(2)}
                            icon="⚡"
                            highlight
                        />
                        <MetricCard
                            label="Overall Error Rate"
                            value={`${(efficiency?.overallErrorRate || 0).toFixed(2)}%`}
                            icon="⚠️"
                            isError
                        />
                    </div>
                </div>

                {/* Productivity by Employee */}
                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                    <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Employee Productivity
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="pb-3 text-gray-400 font-medium">Employee</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Drawers</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Hours</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Drawers/Hour</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Performance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productivity?.map((emp, idx) => (
                                    <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                        <td className="py-4 text-white font-medium">{emp.fullName}</td>
                                        <td className="py-4 text-gray-300 text-center">{emp.totalDrawersCompleted}</td>
                                        <td className="py-4 text-gray-300 text-center">{emp.totalHoursWorked}</td>
                                        <td className="py-4 text-amber-400 font-bold text-center">{emp.drawersPerHour}</td>
                                        <td className="py-4 text-center">
                                            <PerformanceBadge value={emp.drawersPerHour} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Error Rates by Employee */}
                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                    <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Error Rate Analysis
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="pb-3 text-gray-400 font-medium">Employee</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Total Items</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Errors</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Error Rate</th>
                                    <th className="pb-3 text-gray-400 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {errorRates?.map((emp, idx) => (
                                    <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                        <td className="py-4 text-white font-medium">{emp.fullName}</td>
                                        <td className="py-4 text-gray-300 text-center">{emp.totalItems}</td>
                                        <td className="py-4 text-gray-300 text-center">{emp.totalErrors}</td>
                                        <td className="py-4 text-amber-400 font-bold text-center">{emp.errorRatePercent}%</td>
                                        <td className="py-4 text-center">
                                            <ErrorBadge value={emp.errorRatePercent} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Insights and Recommendations */}
                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                    <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Insights & Recommendations
                    </h2>
                    <div className="space-y-3">
                        <InsightCard
                            type="success"
                            message="Top performers show consistent productivity above 1.2 drawers/hour."
                        />
                        <InsightCard
                            type="warning"
                            message="Error rates above 1.5% may indicate need for additional training."
                        />
                        <InsightCard
                            type="info"
                            message="Consider workload balancing to optimize overall efficiency."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components

function MetricCard({ label, value, icon, highlight = false, isError = false }) {
    const bgColor = isError ? 'bg-red-500/10' : highlight ? 'bg-amber-500/10' : 'bg-gray-700/50';
    const borderColor = isError ? 'border-red-500/50' : highlight ? 'border-amber-500' : 'border-gray-600';

    return (
        <div className={`${bgColor} border ${borderColor} rounded-lg p-4 text-center`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`text-2xl font-bold ${isError ? 'text-red-400' : highlight ? 'text-amber-400' : 'text-white'} mb-1`}>
                {value}
            </div>
            <div className="text-gray-400 text-sm">{label}</div>
        </div>
    );
}

function PerformanceBadge({ value }) {
    if (value >= 1.2) {
        return <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">Excellent</span>;
    } else if (value >= 1.0) {
        return <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-medium">Good</span>;
    } else {
        return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">Needs Training</span>;
    }
}

function ErrorBadge({ value }) {
    if (value < 1.0) {
        return <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">Excellent</span>;
    } else if (value < 1.5) {
        return <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-medium">Good</span>;
    } else {
        return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">Needs Attention</span>;
    }
}

function InsightCard({ type, message }) {
    const colors = {
        success: { bg: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-400', icon: '✓' },
        warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: '⚠' },
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', icon: 'ℹ' }
    };

    const color = colors[type] || colors.info;

    return (
        <div className={`${color.bg} border ${color.border} rounded-lg p-4 flex items-start`}>
            <span className={`${color.text} text-xl mr-3 flex-shrink-0`}>{color.icon}</span>
            <p className={`${color.text} text-sm`}>{message}</p>
        </div>
    );
}
