import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3001';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is already logged in (on app load)
    useEffect(() => {
        checkAuth();
    }, []);

    // Check authentication status
    const checkAuth = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                credentials: 'include' // Include cookies
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Login function
    const login = async (username, password) => {
        try {
            setError(null);
            console.log('Attempting login with:', { username, apiUrl: API_URL });

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Include cookies
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error details:', error);
            const errorMessage = error.message || 'Connection failed. Please check if the backend server is running.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    // Check if user has a specific role
    const hasRole = (role) => {
        return user?.role === role;
    };

    // Check if user is supervisor
    const isSupervisor = () => {
        return user?.role === 'supervisor';
    };

    // Check if user is employee
    const isEmployee = () => {
        return user?.role === 'employee';
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        hasRole,
        isSupervisor,
        isEmployee,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
