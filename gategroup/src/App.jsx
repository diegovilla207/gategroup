import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import SmartBottleAnalyzer from './pages/SmartBottleAnalyzer';
import Inventory from './pages/Inventory';
import SupervisorDashboard from './pages/SupervisorDashboard';
import EnhancedSupervisorDashboard from './pages/EnhancedSupervisorDashboard';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Route - Login Page */}
                    <Route path="/" element={<Login />} />

                    {/* Protected Routes - Require Authentication */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/smart-bottle"
                        element={
                            <ProtectedRoute>
                                <SmartBottleAnalyzer />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/inventory"
                        element={
                            <ProtectedRoute>
                                <Inventory />
                            </ProtectedRoute>
                        }
                    />

                    {/* Supervisor-Only Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute requiredRole="supervisor">
                                <EnhancedSupervisorDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Legacy Dashboard (Keep for backward compatibility) */}
                    <Route
                        path="/dashboard/basic"
                        element={
                            <ProtectedRoute requiredRole="supervisor">
                                <SupervisorDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
