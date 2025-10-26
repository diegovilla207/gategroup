import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import AIAssistant from '../components/AIAssistant';

const API_URL = 'http://localhost:3001';

// Color palette
const COLORS = {
    primary: '#F59E0B',      // amber-500
    secondary: '#10B981',     // green-500
    danger: '#EF4444',        // red-500
    warning: '#F59E0B',       // yellow-500
    info: '#3B82F6',          // blue-500
    purple: '#8B5CF6',        // purple-500
};

const CHART_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.info,
    COLORS.purple,
    '#EC4899', // pink
    '#14B8A6', // teal
];

export default function EnhancedSupervisorDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [enhancedData, setEnhancedData] = useState(null);
    const [trainingNeeds, setTrainingNeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedView, setSelectedView] = useState('overview'); // overview, performance, errors, sustainability
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchAllData();
        // Refresh data every 30 seconds
        const interval = setInterval(fetchAllData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            const [basicResponse, enhancedResponse, trainingResponse] = await Promise.all([
                fetch(`${API_URL}/api/metrics/dashboard`, { credentials: 'include' }),
                fetch(`${API_URL}/api/analytics/enhanced-dashboard`, { credentials: 'include' }),
                fetch(`${API_URL}/api/analytics/training-needs`, { credentials: 'include' })
            ]);

            if (!basicResponse.ok || !enhancedResponse.ok || !trainingResponse.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const [basic, enhanced, training] = await Promise.all([
                basicResponse.json(),
                enhancedResponse.json(),
                trainingResponse.json()
            ]);

            setDashboardData(basic);
            setEnhancedData(enhanced);
            setTrainingNeeds(training);
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

    const acknowledgeAlert = async (alertId) => {
        try {
            await fetch(`${API_URL}/api/analytics/alert/acknowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ alertId })
            });
            fetchAllData();
        } catch (err) {
            console.error('Error acknowledging alert:', err);
        }
    };

    if (loading && !dashboardData) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
                    <p className="text-white mt-4 text-lg">Loading enhanced dashboard...</p>
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
                        onClick={fetchAllData}
                        className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-6 rounded-lg transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { productivity, errorRates, efficiency } = dashboardData || {};
    const { performanceTrends, errorDistribution, employeeMetrics, alerts, sustainabilityMetrics } = enhancedData || {};

    return (
        <div className={`min-h-screen bg-gray-900 ${isChatOpen ? 'pr-96' : ''} transition-all duration-300`}>
            {/* Header */}
            <div className="bg-gray-800 border-b border-amber-500/20 sticky top-0 z-30">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                                Enhanced <span className="text-amber-400">Dashboard</span>
                            </h1>
                            <p className="text-gray-400">Welcome, {user?.fullName || user?.username}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/home')}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all"
                            >
                                Home
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* View Tabs */}
                    <div className="flex gap-2 mt-4 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'errors', label: 'Error Analysis', icon: '⚠️' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedView(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                                    selectedView === tab.id
                                        ? 'bg-amber-500 text-gray-900'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Active Alerts */}
                {alerts && alerts.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-red-400 font-bold flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Active Alerts ({alerts.length})
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {alerts.slice(0, 3).map(alert => (
                                <div key={alert.id} className="flex items-start justify-between bg-gray-800 rounded-lg p-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                alert.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                                                alert.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                                                'bg-yellow-500 text-gray-900'
                                            }`}>
                                                {alert.severity}
                                            </span>
                                            <span className="text-white font-medium text-sm">{alert.title}</span>
                                        </div>
                                        <p className="text-gray-400 text-xs">{alert.message}</p>
                                    </div>
                                    <button
                                        onClick={() => acknowledgeAlert(alert.id)}
                                        className="text-green-400 hover:text-green-300 text-xs ml-2"
                                    >
                                        ✓ Ack
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {selectedView === 'overview' && (
                    <>
                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MetricCard
                                label="Total Employees"
                                value={efficiency?.totalEmployees || 0}
                                icon="👥"
                                color="bg-blue-500/10 border-blue-500/50"
                                textColor="text-blue-400"
                            />
                            <MetricCard
                                label="Drawers Completed"
                                value={efficiency?.totalDrawersCompleted || 0}
                                icon="📦"
                                color="bg-green-500/10 border-green-500/50"
                                textColor="text-green-400"
                            />
                            <MetricCard
                                label="Avg Drawers/Hour"
                                value={(efficiency?.avgDrawersPerHour || 0).toFixed(2)}
                                icon="⚡"
                                color="bg-amber-500/10 border-amber-500"
                                textColor="text-amber-400"
                            />
                            <MetricCard
                                label="Error Rate"
                                value={`${(efficiency?.overallErrorRate || 0).toFixed(2)}%`}
                                icon="⚠️"
                                color="bg-red-500/10 border-red-500/50"
                                textColor="text-red-400"
                            />
                        </div>

                        {/* Performance Trends Chart */}
                        {performanceTrends && performanceTrends.length > 0 && (
                            <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                                <h2 className="text-2xl font-bold text-amber-400 mb-6">Performance Trends (30 Days)</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={performanceTrends.reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#9CA3AF"
                                            tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                                        />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #F59E0B' }}
                                            labelStyle={{ color: '#F59E0B' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="sessions" stroke={COLORS.primary} name="Sessions" strokeWidth={2} />
                                        <Line type="monotone" dataKey="errorRate" stroke={COLORS.danger} name="Error Rate %" strokeWidth={2} />
                                        <Line type="monotone" dataKey="avgTime" stroke={COLORS.info} name="Avg Time (min)" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Employee Performance Table */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                            <h2 className="text-2xl font-bold text-amber-400 mb-6">Employee Performance</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="pb-3 text-gray-400 font-medium">Employee</th>
                                            <th className="pb-3 text-gray-400 font-medium text-center">Items/Hr</th>
                                            <th className="pb-3 text-gray-400 font-medium text-center">Error Rate</th>
                                            <th className="pb-3 text-gray-400 font-medium text-center">Accuracy</th>
                                            <th className="pb-3 text-gray-400 font-medium text-center">Score</th>
                                            <th className="pb-3 text-gray-400 font-medium text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productivity?.map((emp, idx) => {
                                            const metric = employeeMetrics?.find(m => m.username === emp.username) || {};
                                            return (
                                                <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                                    <td className="py-4 text-white font-medium">{emp.fullName}</td>
                                                    <td className="py-4 text-gray-300 text-center">{metric.itemsPerHour?.toFixed(1) || emp.drawersPerHour}</td>
                                                    <td className="py-4 text-gray-300 text-center">{metric.errorRate?.toFixed(2) || '0'}%</td>
                                                    <td className="py-4 text-green-400 text-center">{metric.accuracyScore?.toFixed(1) || '100'}%</td>
                                                    <td className="py-4 text-amber-400 font-bold text-center">{metric.performanceScore?.toFixed(0) || 'N/A'}</td>
                                                    <td className="py-4 text-center">
                                                        <PerformanceBadge value={emp.drawersPerHour} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Performance Tab */}
                {selectedView === 'performance' && (
                    <>
                        {/* Performance Distribution */}
                        {employeeMetrics && employeeMetrics.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Items Per Hour Chart */}
                                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                                    <h2 className="text-xl font-bold text-amber-400 mb-4">Items Per Hour</h2>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={employeeMetrics}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="fullName" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #F59E0B' }} />
                                            <Bar dataKey="itemsPerHour" fill={COLORS.primary} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Accuracy Score Chart */}
                                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                                    <h2 className="text-xl font-bold text-amber-400 mb-4">Accuracy Score</h2>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={employeeMetrics}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="fullName" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                                            <YAxis stroke="#9CA3AF" domain={[90, 100]} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #10B981' }} />
                                            <Bar dataKey="accuracyScore" fill={COLORS.secondary} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Training Needs */}
                        {trainingNeeds && trainingNeeds.length > 0 && (
                            <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                                <h2 className="text-2xl font-bold text-amber-400 mb-6">Training Needs</h2>
                                <div className="space-y-3">
                                    {trainingNeeds.map(need => (
                                        <div key={need.id} className="bg-gray-700 rounded-lg p-4 flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        need.priority === 'URGENT' ? 'bg-red-500 text-white' :
                                                        need.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                                                        need.priority === 'MEDIUM' ? 'bg-yellow-500 text-gray-900' :
                                                        'bg-green-500 text-white'
                                                    }`}>
                                                        {need.priority}
                                                    </span>
                                                    <span className="text-white font-medium">{need.skillArea}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm">
                                                    Current: {need.currentScore?.toFixed(1)}% → Target: {need.targetScore}%
                                                </p>
                                                {need.notes && (
                                                    <p className="text-gray-500 text-xs mt-1">{need.notes}</p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded text-xs font-medium ${
                                                need.status === 'PENDING' ? 'bg-gray-600 text-gray-300' :
                                                need.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                                {need.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Errors Tab */}
                {selectedView === 'errors' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Error Distribution Pie Chart */}
                            {errorDistribution && errorDistribution.length > 0 && (
                                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                                    <h2 className="text-xl font-bold text-amber-400 mb-4">Error Distribution</h2>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={errorDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({type, percentage}) => `${type}: ${percentage}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {errorDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #F59E0B' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Error Details */}
                            {errorDistribution && errorDistribution.length > 0 && (
                                <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                                    <h2 className="text-xl font-bold text-amber-400 mb-4">Error Types</h2>
                                    <div className="space-y-3">
                                        {errorDistribution.map((error, index) => (
                                            <div key={index} className="bg-gray-700 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-white font-medium">{error.type}</span>
                                                    <span className="text-amber-400 font-bold">{error.count}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">{error.percentage}% of total</span>
                                                    {error.criticalPercent > 0 && (
                                                        <span className="text-red-400">{error.criticalPercent}% critical</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error Rates by Employee */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                            <h2 className="text-2xl font-bold text-amber-400 mb-6">Error Rate Analysis</h2>
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
                    </>
                )}

                {/* Sustainability Tab */}
                {selectedView === 'sustainability' && sustainabilityMetrics && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <SustainabilityCard
                                label="Errors Prevented"
                                value={sustainabilityMetrics.errorsPrevented}
                                icon="✅"
                                color="bg-green-500/10 border-green-500/50"
                            />
                            <SustainabilityCard
                                label="Waste Reduced"
                                value={`${sustainabilityMetrics.wasteReduction.toFixed(2)} kg`}
                                icon="♻️"
                                color="bg-blue-500/10 border-blue-500/50"
                            />
                            <SustainabilityCard
                                label="Time Saved"
                                value={`${sustainabilityMetrics.timeSaved} min`}
                                icon="⏱️"
                                color="bg-purple-500/10 border-purple-500/50"
                            />
                            <SustainabilityCard
                                label="Cost Savings"
                                value={`$${sustainabilityMetrics.costSavings.toFixed(2)}`}
                                icon="💰"
                                color="bg-yellow-500/10 border-yellow-500/50"
                            />
                            <SustainabilityCard
                                label="Carbon Reduced"
                                value={`${sustainabilityMetrics.carbonReduction.toFixed(2)} kg CO₂`}
                                icon="🌍"
                                color="bg-green-500/10 border-green-500/50"
                            />
                            <SustainabilityCard
                                label="Efficiency"
                                value={`${sustainabilityMetrics.efficiency.toFixed(1)}%`}
                                icon="📊"
                                color="bg-amber-500/10 border-amber-500"
                            />
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/20 shadow-xl">
                            <h2 className="text-2xl font-bold text-amber-400 mb-4">Impact Summary (Last 30 Days)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-white font-bold text-lg mb-3">Environmental Impact</h3>
                                    <ImpactItem
                                        icon="🌱"
                                        label="Waste Prevention"
                                        value={`${sustainabilityMetrics.wasteReduction.toFixed(2)} kg`}
                                        description="Food waste prevented through accurate inventory"
                                    />
                                    <ImpactItem
                                        icon="🌍"
                                        label="Carbon Footprint"
                                        value={`${sustainabilityMetrics.carbonReduction.toFixed(2)} kg CO₂`}
                                        description="Reduced through optimized processes"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-white font-bold text-lg mb-3">Operational Efficiency</h3>
                                    <ImpactItem
                                        icon="⚡"
                                        label="Process Efficiency"
                                        value={`${sustainabilityMetrics.efficiency.toFixed(1)}%`}
                                        description="Overall system efficiency improvement"
                                    />
                                    <ImpactItem
                                        icon="💵"
                                        label="Cost Savings"
                                        value={`$${sustainabilityMetrics.costSavings.toFixed(2)}`}
                                        description="Total savings from error prevention"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* AI Assistant */}
            <AIAssistant
                dashboardData={enhancedData}
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
                user={user}
            />
        </div>
    );
}

// Helper Components
function MetricCard({ label, value, icon, color, textColor }) {
    return (
        <div className={`${color} border rounded-lg p-4 text-center`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className={`text-2xl font-bold ${textColor} mb-1`}>
                {value}
            </div>
            <div className="text-gray-400 text-sm">{label}</div>
        </div>
    );
}

function SustainabilityCard({ label, value, icon, color }) {
    return (
        <div className={`${color} border rounded-lg p-4 text-center`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-gray-400 text-sm">{label}</div>
        </div>
    );
}

function ImpactItem({ icon, label, value, description }) {
    return (
        <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{icon}</span>
                <div>
                    <div className="text-white font-bold">{label}</div>
                    <div className="text-amber-400 text-lg font-bold">{value}</div>
                </div>
            </div>
            <p className="text-gray-400 text-sm">{description}</p>
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
