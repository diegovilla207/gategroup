import React from 'react';

// Componente de mascota águila chef
export default function EagleMascot({ message, size = "large", animated = true }) {
    const sizeClasses = {
        small: "w-24 h-24",
        medium: "w-32 h-32",
        large: "w-48 h-48"
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* GATEGROUP Chef Bird SVG */}
            <div className={`${sizeClasses[size]} ${animated ? 'animate-float' : ''}`}>
                <svg viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Patas (feet at bottom) */}
                    <g>
                        {/* Left foot */}
                        <ellipse cx="75" cy="230" rx="8" ry="5" fill="#f59e0b" />
                        <path d="M70 230 L65 237 M75 230 L75 237 M80 230 L85 237" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Right foot */}
                        <ellipse cx="125" cy="230" rx="8" ry="5" fill="#f59e0b" />
                        <path d="M120 230 L115 237 M125 230 L125 237 M130 230 L135 237" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                    </g>

                    {/* Delantal blanco (white apron) */}
                    <path d="M70 145 L70 210 Q75 215 100 215 Q125 215 130 210 L130 145 Z" fill="#e0f2fe" />
                    <path d="M70 145 L70 210 Q75 215 100 215 Q125 215 130 210 L130 145 Z" fill="white" opacity="0.9" />

                    {/* Cuerpo azul (blue chef jacket) */}
                    <ellipse cx="100" cy="140" rx="50" ry="60" fill="#2563eb" />
                    <path d="M60 120 Q50 140 55 160 L65 150 Z" fill="#2563eb" />
                    <path d="M140 120 Q150 140 145 160 L135 150 Z" fill="#2563eb" />

                    {/* Detalles del uniforme (jacket details) */}
                    <ellipse cx="85" cy="145" rx="4" ry="4" fill="#1e40af" />
                    <ellipse cx="85" cy="160" rx="4" ry="4" fill="#1e40af" />
                    <ellipse cx="115" cy="145" rx="4" ry="4" fill="#1e40af" />
                    <ellipse cx="115" cy="160" rx="4" ry="4" fill="#1e40af" />

                    {/* Alas levantadas (raised wings) */}
                    <g className={animated ? 'origin-center animate-wiggle' : ''} style={{ animationDelay: '0s' }}>
                        {/* Left wing */}
                        <path d="M50 110 Q25 95 20 120 Q25 115 35 118 Q45 120 50 125 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5" />
                        <path d="M35 105 Q30 100 28 108 L32 112 Z" fill="#60a5fa" />
                        <path d="M28 110 Q23 105 21 113 L25 117 Z" fill="#60a5fa" />
                    </g>
                    <g className={animated ? 'origin-center animate-wiggle' : ''} style={{ animationDelay: '0.2s' }}>
                        {/* Right wing */}
                        <path d="M150 110 Q175 95 180 120 Q175 115 165 118 Q155 120 150 125 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5" />
                        <path d="M165 105 Q170 100 172 108 L168 112 Z" fill="#60a5fa" />
                        <path d="M172 110 Q177 105 179 113 L175 117 Z" fill="#60a5fa" />
                    </g>

                    {/* Cabeza redonda (round head) */}
                    <circle cx="100" cy="75" r="38" fill="#2563eb" />

                    {/* Banda del gorro (hat band with GATEGROUP) */}
                    <ellipse cx="100" cy="65" rx="42" ry="10" fill="#2563eb" />
                    <rect x="58" y="60" width="84" height="10" rx="1" fill="#2563eb" />
                    <text x="100" y="67" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">GATEGROUP</text>

                    {/* Gorro de chef (chef hat) */}
                    <ellipse cx="100" cy="35" rx="35" ry="25" fill="white" />
                    <ellipse cx="100" cy="28" rx="32" ry="22" fill="#f0f9ff" />
                    <path d="M68 50 Q75 25 100 20 Q125 25 132 50" fill="white" />

                    {/* Pico naranja (orange beak) */}
                    <ellipse cx="100" cy="85" rx="10" ry="8" fill="#f59e0b" />
                    <path d="M100 82 L115 85 L100 88 Z" fill="#f97316" />
                    {/* Open mouth */}
                    <path d="M100 88 Q105 92 110 90" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M102 90 Q104 93 106 91" fill="#dc2626" />

                    {/* Ojos expresivos (expressive eyes - one winking) */}
                    <g className={animated ? 'animate-pop' : ''} style={{ animationIterationCount: 'infinite', animationDuration: '3s' }}>
                        {/* Left eye (open with large pupil) */}
                        <ellipse cx="82" cy="72" rx="9" ry="10" fill="white" />
                        <circle cx="82" cy="72" r="8" fill="white" stroke="#1f2937" strokeWidth="2" />
                        <circle cx="83" cy="73" r="5" fill="#1f2937" />
                        <circle cx="84" cy="71" r="2" fill="white" />

                        {/* Right eye (winking) */}
                        <ellipse cx="118" cy="72" rx="9" ry="10" fill="white" />
                        <circle cx="118" cy="72" r="8" fill="white" stroke="#1f2937" strokeWidth="2" />
                        <circle cx="119" cy="73" r="5" fill="#1f2937" />
                        <circle cx="120" cy="71" r="2" fill="white" />
                    </g>

                    {/* Cejas expresivas (expressive eyebrows) */}
                    <path d="M73 62 Q82 60 88 63" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <path d="M112 63 Q118 60 127 62" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
            </div>

            {/* Burbuja de diálogo */}
            {message && (
                <div className="relative animate-bounce-in">
                    <div className="bg-white text-gray-800 px-6 py-4 rounded-2xl shadow-lg max-w-xs relative">
                        <p className="text-center font-medium">{message}</p>
                        {/* Pico de la burbuja */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
