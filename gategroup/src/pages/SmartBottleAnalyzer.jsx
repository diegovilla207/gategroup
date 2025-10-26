import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import robotDown from '../assets/robot-down.png';

// ¡API Key implementada como solicitaste!
const GEMINI_API_KEY = "AIzaSyAxGw0arzRYw_VxnH73NIeK7wnOEJ28yLY";

// Base de datos de aerolíneas y sus reglas (del CSV)
const airlineSLAPolicies = {
    "BA": "Keep all sealed bottles unopened. Refill if fill between 60–80% and reseal.",
    "EK": "Replace if fill <80% or label damaged",
    "TK": "Refill if fill between 60–80% and reseal",
    "EY": "Replace if fill <80% or label damaged. Refill if fill <90% using incoming bottles and reseal.",
    "CX": "Discard all opened bottles",
    "SQ": "If fill between 60–80%, add 1 additional sealed bottle for next flight"
};

// Objeto "traductor" para los resultados
const actionDetails = {
    "KEEP": {
        action: "REUTILIZAR",
        instruction: "Colocar en contenedor de 'Re-Stock' (SLA Cumplido).",
        class: "bg-gradient-to-br from-green-500 to-green-600 text-white"
    },
    "REPLACE": {
        action: "REEMPLAZAR",
        instruction: "Esta botella no debe volar. Reemplazar por una nueva.",
        class: "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
    },
    "REFILL": {
        action: "RE-RELLENAR",
        instruction: "Enviar a la estación de re-rellenado / combinación.",
        class: "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
    },
    "DISCARD": {
        action: "DESECHAR",
        instruction: "Vaciar líquido y reciclar botella.",
        class: "bg-gradient-to-br from-red-500 to-red-600 text-white"
    },
    "DEFAULT": {
        action: "ERROR",
        instruction: "Regla no encontrada o no clara. Contactar supervisor.",
        class: "bg-gradient-to-br from-gray-500 to-gray-600 text-white"
    }
};

// Lista de aerolíneas para el <select>
const airlines = [
    { code: "BA", name: "British Airways (BA)" },
    { code: "EK", name: "Emirates (EK)" },
    { code: "TK", name: "Turkish Airlines (TK)" },
    { code: "EY", name: "Etihad Airways (EY)" },
    { code: "CX", name: "Cathay Pacific (CX)" },
    { code: "SQ", name: "Singapore Airlines (SQ)" },
];

// Mensajes de la mascota según el paso
const mascotMessages = {
    select: "¿De qué aerolínea es la botella?",
    capture: "¡Perfecta foto! ¿Está lista para analizar?",
    analyzing: "Déjame revisar esa botella...",
    result: "¡Análisis completo! Aquí está tu resultado:",
    success: "¡Excelente trabajo!"
};

// Componente del Robot con mensaje - Professional style
const RobotMessage = ({ message }) => (
    <div className="flex flex-col items-center gap-2 sm:gap-4 animate-float">
        <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
            <img
                src={robotDown}
                alt="GateGroup AI Assistant"
                className="relative w-20 h-20 sm:w-32 sm:h-32 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
            />
        </div>
        <div className="bg-gray-800 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg border-l-4 border-amber-500 max-w-md mx-2">
            <p className="text-white font-medium text-center text-sm sm:text-lg">{message}</p>
        </div>
    </div>
);

// Componente del Spinner (para la carga) - Professional style
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full py-4 sm:py-8">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <div className="absolute inset-0 border-4 sm:border-8 border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 sm:border-8 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-3 sm:inset-4 border-4 sm:border-8 border-transparent border-t-amber-400 rounded-full animate-spin animation-reverse"></div>
        </div>
        <div className="mt-4 sm:mt-8 px-2">
            <p className="text-lg sm:text-2xl font-bold text-center text-white tracking-tight">Analyzing with AI...</p>
        </div>
        <p className="text-xs sm:text-sm text-amber-400 mt-2 text-center px-4 font-medium uppercase tracking-wide">Please wait a moment</p>
        <div className="flex gap-2 mt-3 sm:mt-4">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-amber-300 rounded-full animate-bounce delay-200"></div>
        </div>
    </div>
);

// Componente Principal del Smart Bottle Analyzer
export default function SmartBottleAnalyzer() {
    const navigate = useNavigate();
    const [step, setStep] = useState('select');
    const [selectedAirline, setSelectedAirline] = useState(airlines[0].code);
    const [imageBase64, setImageBase64] = useState(null);
    const [apiResponse, setApiResponse] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Maneja la selección de la imagen
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setImageBase64(e.target.result);
            setStep('capture');
        };
        reader.readAsDataURL(file);
    };

    // Activa el input de archivo oculto
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Llama a la API de Gemini
    const analyzeBottle = async () => {
        if (!imageBase64 || !selectedAirline) return;

        setStep('analyzing');
        setError(null);
        setApiResponse(null);

        const policyText = airlineSLAPolicies[selectedAirline];
        const base64Data = imageBase64.split(',')[1];
        const mimeType = imageBase64.split(';')[0].split(':')[1];

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

        const schema = {
            type: "OBJECT",
            properties: {
                estimatedFillPercent: { type: "NUMBER" },
                estimatedLabelStatus: { type: "STRING" },
                estimatedSealStatus: { type: "STRING" },
                finalAction: { type: "STRING" },
                reasoning: { type: "STRING" }
            },
            required: ["estimatedFillPercent", "estimatedLabelStatus", "estimatedSealStatus", "finalAction", "reasoning"]
        };

        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: `Eres un asistente de control de calidad en una empresa de catering aéreo. Tu trabajo es analizar la imagen de una botella y aplicar una regla de negocio (SLA) para decidir qué hacer con ella.

LA REGLA DE NEGOCIO (SLA) ES: "${policyText}"

PASOS A SEGUIR:
1. Analiza la imagen de la botella.
2. Estima el nivel de llenado y dame un NÚMERO entero ('estimatedFillPercent').
3. Estima el estado de la etiqueta ('estimatedLabelStatus': 'Intact', 'Slightly_Damaged', 'Heavily_Damaged').
4. Estima el estado del sello ('estimatedSealStatus': 'Sealed', 'Opened', 'Resealed').
5. Aplica la REGLA DE NEGOCIO (SLA) a tus estimaciones.
6. Devuelve la acción final ('finalAction'), que debe ser una de: 'KEEP', 'REPLACE', 'REFILL', o 'DISCARD'.

Responde ÚNICAMENTE con el formato JSON solicitado.`
                        },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Error ${response.status}: ${errorBody.error.message}`);
            }

            const result = await response.json();

            if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0].text) {
                throw new Error("Respuesta inesperada de la API. No se encontró texto.");
            }

            const jsonText = result.candidates[0].content.parts[0].text;
            const parsedResponse = JSON.parse(jsonText);

            setApiResponse(parsedResponse);
            setStep('result');

        } catch (err) {
            console.error(err);
            setError(err.message);
            setStep('capture');
        }
    };

    // Reinicia el flujo
    const startOver = () => {
        setStep('select');
        setImageBase64(null);
        setApiResponse(null);
        setError(null);
    };

    // Renderizado de la UI
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-2 sm:p-4 font-sans relative overflow-hidden">
            {/* Elementos decorativos de fondo - Gate Group style */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-40 sm:w-72 h-40 sm:h-72 bg-gray-900/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-48 sm:w-96 h-48 sm:h-96 bg-gray-800/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-gray-700/5 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-2xl relative z-10">

                {/* Botón de regreso Professional style */}
                <button
                    onClick={() => navigate('/home')}
                    className="mb-3 sm:mb-6 flex items-center gap-2 text-white hover:text-amber-400 font-medium transition-all hover:gap-3 bg-gray-800 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg shadow-md hover:shadow-lg text-sm sm:text-base border-l-2 border-amber-500 uppercase tracking-wide"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </button>

                {/* Robot con mensaje dinámico */}
                <div className="mb-4 sm:mb-8">
                    <RobotMessage message={mascotMessages[step] || mascotMessages.select} />
                </div>

                {/* Tarjeta principal - Professional style */}
                <div className="bg-gray-800 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border-l-4 border-amber-500">

                    {/* Cabecera - Professional style */}
                    <header className="bg-gray-800 border-b border-gray-700 p-4 sm:p-8 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/20 rounded-xl mb-2 sm:mb-3 backdrop-blur-sm">
                                <svg className="w-7 h-7 sm:w-10 sm:h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg tracking-tight">Smart Bottle Analyzer</h1>
                            <p className="text-xs sm:text-base text-amber-400 mt-1 sm:mt-2 font-medium tracking-wide uppercase">AI-Powered Quality Control</p>
                        </div>
                    </header>

                    {/* Contenido principal */}
                    <main className="p-4 sm:p-8 min-h-[200px] sm:min-h-[300px] flex flex-col justify-center">

                        {/* PASO 1: SELECCIONAR AEROLÍNEA */}
                        {step === 'select' && (
                            <div className="flex flex-col gap-4 sm:gap-6 animate-slide-up">
                                <div>
                                    <label htmlFor="airline-select" className="block text-base sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                        Selecciona la Aerolínea
                                    </label>
                                    <select
                                        id="airline-select"
                                        value={selectedAirline}
                                        onChange={(e) => setSelectedAirline(e.target.value)}
                                        className="w-full p-3 sm:p-5 bg-gray-700 text-white text-base sm:text-lg rounded-lg border-l-4 border-amber-500 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all shadow-md hover:shadow-lg cursor-pointer"
                                    >
                                        {airlines.map((airline) => (
                                            <option key={airline.code} value={airline.code}>
                                                {airline.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                <button
                                    onClick={triggerFileInput}
                                    className="mt-2 sm:mt-4 mb-1 sm:mb-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 sm:py-7 px-6 sm:px-8 rounded-xl shadow-xl text-base sm:text-xl transition-all duration-300 hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wide"
                                >
                                    <svg className="w-6 h-6 sm:w-9 sm:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Capture Bottle Photo</span>
                                </button>
                            </div>
                        )}

                        {/* PASO 2: CAPTURAR/CONFIRMAR IMAGEN */}
                        {step === 'capture' && imageBase64 && (
                            <div className="flex flex-col gap-4 sm:gap-6 animate-slide-up">
                                <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-br from-blue-50 to-purple-50 p-1 sm:p-2">
                                    <img src={imageBase64} alt="Vista previa de la botella" className="w-full max-h-60 sm:max-h-80 object-contain bg-white rounded-xl" />
                                </div>

                                {error && (
                                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 text-red-800 p-3 sm:p-5 rounded-xl sm:rounded-2xl animate-bounce-in shadow-lg">
                                        <p className="font-bold text-base sm:text-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Error de Análisis
                                        </p>
                                        <p className="text-xs sm:text-sm mt-2 ml-7 sm:ml-8">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={analyzeBottle}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 sm:py-7 px-6 sm:px-8 rounded-xl shadow-xl text-base sm:text-xl transition-all duration-300 hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wide"
                                >
                                    <svg className="w-6 h-6 sm:w-9 sm:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Analyze with AI</span>
                                </button>

                                <button
                                    onClick={startOver}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white border-l-2 border-amber-500 font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all text-sm sm:text-base uppercase tracking-wide"
                                >
                                    Start Over
                                </button>
                            </div>
                        )}

                        {/* PASO 3: ANALIZANDO */}
                        {step === 'analyzing' && (
                            <div className="flex items-center justify-center py-12 animate-bounce-in">
                                <LoadingSpinner />
                            </div>
                        )}

                        {/* PASO 4: RESULTADO */}
                        {step === 'result' && apiResponse && (
                            <div className="flex flex-col gap-4 sm:gap-6 animate-slide-up">
                                {/* Tarjeta de resultado con animación mejorada */}
                                <div className={`${actionDetails[apiResponse.finalAction]?.class || actionDetails['DEFAULT'].class} p-6 sm:p-10 rounded-2xl sm:rounded-3xl text-center shadow-2xl animate-bounce-in relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                                    <div className="relative z-10">
                                        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-90 mb-2 sm:mb-3 flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                            Acción Requerida
                                        </p>
                                        <h3 className="text-4xl sm:text-7xl font-extrabold my-3 sm:my-6 drop-shadow-lg">
                                            {actionDetails[apiResponse.finalAction]?.action || 'ERROR'}
                                        </h3>
                                        <p className="text-sm sm:text-2xl font-semibold px-2 sm:px-4">
                                            {actionDetails[apiResponse.finalAction]?.instruction || 'Contactar supervisor.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Detalles del análisis - Gate Group style */}
                                <div className="bg-gray-50 p-4 sm:p-8 rounded-none border-l-4 border-gray-900 shadow-xl">
                                    <h4 className="font-bold text-gray-900 mb-4 sm:mb-6 text-base sm:text-xl flex items-center gap-2 uppercase tracking-wide">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Analysis Details
                                    </h4>
                                    <div className="space-y-3 sm:space-y-4 text-gray-900">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-3 sm:p-4 rounded-none shadow-md border-l-2 border-gray-900 gap-1 sm:gap-0">
                                            <span className="font-medium text-sm sm:text-lg uppercase tracking-wide">Fill Level:</span>
                                            <span className="font-bold text-xl sm:text-2xl text-gray-900">{apiResponse.estimatedFillPercent}%</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-3 sm:p-4 rounded-none shadow-md border-l-2 border-gray-900 gap-1 sm:gap-0">
                                            <span className="font-medium text-sm sm:text-lg uppercase tracking-wide">Label Status:</span>
                                            <span className="font-bold text-sm sm:text-base text-gray-900">{apiResponse.estimatedLabelStatus}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-3 sm:p-4 rounded-none shadow-md border-l-2 border-gray-900 gap-1 sm:gap-0">
                                            <span className="font-medium text-sm sm:text-lg uppercase tracking-wide">Seal Status:</span>
                                            <span className="font-bold text-sm sm:text-base text-gray-900">{apiResponse.estimatedSealStatus}</span>
                                        </div>
                                        <div className="bg-white p-3 sm:p-5 rounded-none shadow-md border-l-2 border-gray-900">
                                            <p className="font-semibold mb-2 text-sm sm:text-lg flex items-center gap-2 uppercase tracking-wide">
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                </svg>
                                                Reasoning:
                                            </p>
                                            <p className="text-xs sm:text-base font-light text-gray-700 ml-6 sm:ml-7">"{apiResponse.reasoning}"</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={startOver}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 sm:py-7 px-6 sm:px-8 rounded-xl shadow-xl text-base sm:text-xl transition-all duration-300 hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wide"
                                >
                                    <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Analyze Next Bottle</span>
                                </button>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
}
