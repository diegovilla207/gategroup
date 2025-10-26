import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import robotMascot from '/src/assets/robot.png';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    // Redirect to home if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/home', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(username, password);

            if (result.success) {
                // Redirect to home page after successful login
                navigate('/home');
            } else {
                setError(result.error || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
            {/* Decorative floating elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-float"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-20 left-32 w-24 h-24 bg-gray-700/15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-32 right-40 w-12 h-12 bg-white/5 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>

            <div className="max-w-md w-full">
                {/* Login Card */}
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-amber-500/20">
                    {/* Logo and Title */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img
                                src={robotMascot}
                                alt="Gate Group Robot"
                                className="w-24 h-24 object-contain animate-float"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome to <span className="text-amber-400">SmartStation</span>
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Please sign in to continue
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Enter your username"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-xs">
                            GateGroup SmartStation - HackMTY 2025
                        </p>
                    </div>
                </div>

                {/* Demo Credentials Info (Remove in production) */}
                <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-lg p-4 border border-amber-500/20">
                    <p className="text-gray-300 text-xs text-center mb-2 font-semibold">
                        Demo Credentials
                    </p>
                    <div className="text-gray-400 text-xs space-y-1">
                        <p>Employee: <span className="text-amber-400 font-mono">employee</span> / <span className="text-amber-400 font-mono">password123</span></p>
                        <p>Supervisor: <span className="text-amber-400 font-mono">supervisor</span> / <span className="text-amber-400 font-mono">password123</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
