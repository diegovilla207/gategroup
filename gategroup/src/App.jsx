import React, { useState, useRef } from 'react';

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
        class: "bg-green-600 text-white" 
    },
    "REPLACE": { 
        action: "REEMPLAZAR", 
        instruction: "Esta botella no debe volar. Reemplazar por una nueva.", 
        class: "bg-yellow-500 text-gray-900" 
    },
    "REFILL": { 
        action: "RE-RELLENAR", 
        instruction: "Enviar a la estación de re-rellenado / combinación.", 
        class: "bg-blue-600 text-white" 
    },
    "DISCARD": { 
        action: "DESECHAR", 
        instruction: "Vaciar líquido y reciclar botella.", 
        class: "bg-red-600 text-white" 
    },
    "DEFAULT": {
        action: "ERROR",
        instruction: "Regla no encontrada o no clara. Contactar supervisor.",
        class: "bg-gray-500 text-white"
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

// Componente del Spinner (para la carga)
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full">
        <svg className="animate-spin -ml-1 mr-3 h-16 w-16 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg text-gray-300">Analizando con Gemini...</p>
        <p className="text-sm text-gray-400">Esto puede tardar unos segundos.</p>
    </div>
);

// Componente Principal de la App
export default function App() {
    // Hooks de estado para manejar la UI
    const [step, setStep] = useState('select'); // 'select', 'capture', 'analyzing', 'result'
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
            setStep('capture'); // Volver al paso de captura si hay error
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
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: '600px' }}>
                
                {/* Cabecera */}
                <header className="bg-gray-700 p-4 border-b border-gray-600 text-center">
                    <h1 className="text-2xl font-bold">Smart Bottle Analyzer</h1>
                    <p className="text-sm text-yellow-400">Reto 1: Alcohol Handling</p>
                </header>

                {/* Contenido principal */}
                <main className="p-6">
                    
                    {/* PASO 1: SELECCIONAR AEROLÍNEA */}
                    {step === 'select' && (
                        <div className="flex flex-col gap-6 animate-fade-in">
                            <h2 className="text-xl font-semibold text-center text-gray-200">Bienvenido, Operario</h2>
                            <div>
                                <label htmlFor="airline-select" className="block text-sm font-medium text-gray-300 mb-2">
                                    1. Seleccione la Aerolínea (SLA)
                                </label>
                                <select 
                                    id="airline-select"
                                    value={selectedAirline}
                                    onChange={(e) => setSelectedAirline(e.target.value)}
                                    className="w-full p-4 bg-gray-700 text-white text-lg rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                >
                                    {airlines.map((airline) => (
                                        <option key={airline.code} value={airline.code}>
                                            {airline.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Input de archivo oculto */}
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" // Prioriza la cámara trasera en móviles
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            
                            <button 
                                onClick={triggerFileInput}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-4 px-6 rounded-lg shadow-lg text-xl transition-transform transform hover:scale-105"
                            >
                                2. Tomar Foto de la Botella
                            </button>
                        </div>
                    )}

                    {/* PASO 2: CAPTURAR/CONFIRMAR IMAGEN */}
                    {step === 'capture' && imageBase64 && (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <h2 className="text-xl font-semibold text-gray-200">Confirmar Imagen</h2>
                            <img src={imageBase64} alt="Vista previa de la botella" className="rounded-lg shadow-lg w-full max-h-64 object-contain" />
                            
                            {/* Mensaje de error (si existe) */}
                            {error && (
                                <div className="bg-red-800 border border-red-600 text-red-100 p-3 rounded-lg text-center">
                                    <p className="font-bold">Error de Análisis</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            <button 
                                onClick={analyzeBottle}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-xl transition-transform transform hover:scale-105"
                            >
                                Analizar con Gemini
                            </button>
                            <button 
                                onClick={startOver} // Permite cambiar la aerolínea o la foto
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg shadow text-md"
                            >
                                Empezar de Nuevo
                            </button>
                        </div>
                    )}

                    {/* PASO 3: ANALIZANDO */}
                    {step === 'analyzing' && (
                        <div className="h-96 flex items-center justify-center animate-fade-in">
                            <LoadingSpinner />
                        </div>
                    )}

                    {/* PASO 4: RESULTADO */}
                    {step === 'result' && apiResponse && (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <h2 className="text-xl font-semibold text-center text-gray-200">Análisis Completo</h2>
                            
                            {/* La tarjeta de resultado con color dinámico */}
                            <div className={`p-6 rounded-lg text-center shadow-inner ${actionDetails[apiResponse.finalAction]?.class || actionDetails['DEFAULT'].class}`}>
                                <p className="text-sm font-medium uppercase tracking-wider">Acción Requerida</p>
                                <h3 className="text-5xl font-extrabold my-2">
                                    {actionDetails[apiResponse.finalAction]?.action || 'ERROR'}
                                </h3>
                                <p className="text-lg">
                                    {actionDetails[apiResponse.finalAction]?.instruction || 'Contactar supervisor.'}
                                </p>
                            </div>

                            {/* Detalles del análisis de IA */}
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-100 mb-2">Detalles de la IA:</h4>
                                <ul className="text-sm text-gray-300 space-y-1">
                                    <li><strong>Nivel Estimado:</strong> {apiResponse.estimatedFillPercent}%</li>
                                    <li><strong>Estado de Etiqueta:</strong> {apiResponse.estimatedLabelStatus}</li>
                                    <li><strong>Estado de Sello:</strong> {apiResponse.estimatedSealStatus}</li>
                                    <li className="pt-2 italic"><strong>Razón:</strong> "{apiResponse.reasoning}"</li>
                                </ul>
                            </div>
                            
                            <button 
                                onClick={startOver}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-4 px-6 rounded-lg shadow-lg text-xl transition-transform transform hover:scale-105 mt-4"
                            >
                                Analizar Siguiente Botella
                            </button>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}