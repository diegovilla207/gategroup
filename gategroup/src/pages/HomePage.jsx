import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import the image using the full relative path
import bottleIcon from '/src/assets/botella.jpg';
import robotMascot from '/src/assets/robot.png';
import { useSound } from '../hooks/useSound';

export default function HomePage() {
    const navigate = useNavigate();
    const { user, logout, isSupervisor } = useAuth();
    const playButtonSound = useSound('/sounds/Sound-Button.mp3', { volume: 0.5 });

    const handleLogout = async () => {
        await playButtonSound();
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-3 sm:p-6 font-sans overflow-hidden relative">
            {/* User Info and Logout Button - Top Right */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
                <div className="bg-gray-800/80 backdrop-blur-md rounded-lg px-4 py-2 border border-amber-500/30">
                    <p className="text-amber-400 text-sm font-medium">
                        {user?.fullName || user?.username}
                    </p>
                    <p className="text-gray-400 text-xs capitalize">
                        {user?.role}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg"
                >
                    Logout
                </button>
            </div>
            {/* Decorative floating elements - Gate Group style */}
            <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-12 sm:w-20 h-12 sm:h-20 bg-white/5 rounded-full animate-float"></div>
            <div className="absolute top-20 sm:top-32 right-10 sm:right-20 w-10 sm:w-16 h-10 sm:h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-32 w-16 sm:w-24 h-16 sm:h-24 bg-gray-700/15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 sm:bottom-32 right-20 sm:right-40 w-8 sm:w-12 h-8 sm:h-12 bg-white/5 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>

            <div className="w-full max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">

                    {/* Left side: Hero section con mascota */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-6">
                        {/* Main Title */}
                        <div className="animate-bounce-in">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-2xl tracking-tight">
                                GateGroup<br />
                                <span className="text-amber-400 font-bold">SmartStation</span>
                            </h1>
                            <p className="text-sm sm:text-lg text-amber-400 font-medium tracking-wide uppercase">
                                HackMTY 2025
                            </p>
                            <p className="text-base sm:text-xl text-gray-300 font-light tracking-wide mt-2">
                                AI-Powered Operations Platform
                            </p>
                        </div>

                        {/* Robot Mascot with Animation - Hidden message bubble on mobile */}
                        <div className="relative">
                            <div className="animate-bounce-in">
                                <img
                                    src={robotMascot}
                                    alt="Gate Group Robot Assistant"
                                    className="w-40 h-40 sm:w-56 sm:h-56 object-contain animate-float hover:scale-110 transition-transform duration-300 filter drop-shadow-2xl"
                                />
                            </div>

                            {/* Welcome Message Bubble - Hidden on mobile */}
                            <div className="hidden lg:block absolute -right-60 top-11 animate-bounce-in" style={{ animationDelay: '0.3s' }}>
                                <div className="bg-white text-gray-900 px-5 py-3 rounded-lg shadow-2xl relative border-l-4 border-gray-900">
                                    <p className="font-medium text-base whitespace-nowrap">How can I assist you today?</p>
                                    {/* Bubble arrow */}
                                    <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2">
                                        <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile message bubble - shown below bird on mobile */}
                        <div className="lg:hidden animate-bounce-in" style={{ animationDelay: '0.3s' }}>
                            <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-2xl border-l-4 border-gray-900">
                                <p className="font-medium text-sm">How can I assist you today?</p>
                            </div>
                        </div>

                    </div>

                    {/* Right side: Action Cards */}
                    <div className="space-y-4 sm:space-y-5 animate-slide-up">

                        {/* Smart Bottle Analyzer Card - Professional Style */}
                        <button
                            onClick={async () => {
                                await playButtonSound();
                                navigate('/smart-bottle');
                            }}
                            className="group w-full bg-gray-800 hover:bg-gray-750 rounded-xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl border-l-4 border-amber-500 hover:border-l-8"
                        >
                            <div className="flex items-center gap-3 sm:gap-5">
                                {/* Icon Circle */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 text-left">
                                    <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors tracking-tight">
                                        Smart Bottle Analyzer
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-300 font-light">
                                        AI-powered bottle quality control
                                    </p>
                                    <div className="mt-1 sm:mt-2 flex items-center gap-2">
                                        <span className="text-xs font-medium text-amber-400 bg-amber-500/20 px-2 sm:px-3 py-1 rounded-lg uppercase tracking-wider">
                                            Gemini AI
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Inventory Card - Professional Style */}
                        <button
                            onClick={async () => {
                                await playButtonSound();
                                navigate('/inventory');
                            }}
                            className="group w-full bg-gray-800 hover:bg-gray-750 rounded-xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl border-l-4 border-amber-500 hover:border-l-8"
                        >
                            <div className="flex items-center gap-3 sm:gap-5">
                                {/* Icon Circle */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 text-left">
                                    <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors tracking-tight">
                                        Inventory Manager
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-300 font-light">
                                        Smart bin & product tracking
                                    </p>
                                    <div className="mt-1 sm:mt-2 flex items-center gap-2">
                                        <span className="text-xs font-medium text-amber-400 bg-amber-500/20 px-2 sm:px-3 py-1 rounded-lg uppercase tracking-wider">
                                            Real-time
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Supervisor Dashboard Card - Only visible to supervisors */}
                        {isSupervisor() && (
                            <button
                                onClick={async () => {
                                    await playButtonSound();
                                    navigate('/dashboard');
                                }}
                                className="group w-full bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 rounded-xl p-4 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl border-l-4 border-purple-400 hover:border-l-8"
                            >
                                <div className="flex items-center gap-3 sm:gap-5">
                                    {/* Icon Circle */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                                            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 text-left">
                                        <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors tracking-tight">
                                            Analytics Dashboard
                                        </h2>
                                        <p className="text-sm sm:text-base text-gray-300 font-light">
                                            Team metrics & performance insights
                                        </p>
                                        <div className="mt-1 sm:mt-2 flex items-center gap-2">
                                            <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 sm:px-3 py-1 rounded-lg uppercase tracking-wider">
                                                Supervisor Only
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        )}

                        {/* Extra Info Card */}
                        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-amber-500/30">
                            <p className="text-gray-300 text-center font-light text-xs sm:text-sm tracking-wide">
                                💡 Select a challenge to begin
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
