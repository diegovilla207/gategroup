import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component - Wraps routes that require authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string|string[]} props.requiredRole - Required role(s) to access the route
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
    const { user, loading, isAuthenticated } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
                    <p className="text-white mt-4 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Check for required role if specified
    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        if (!allowedRoles.includes(user.role)) {
            // Redirect to home if user doesn't have required role
            return (
                <Navigate
                    to="/home"
                    replace
                    state={{
                        error: 'You do not have permission to access this page.',
                        requiredRole: allowedRoles.join(' or ')
                    }}
                />
            );
        }
    }

    // User is authenticated and has required role (if any), render children
    return children;
}
