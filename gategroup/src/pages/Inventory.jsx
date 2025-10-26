import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EagleMascot from '../components/EagleMascot';

const BACKEND_URL = 'http://localhost:3001';
const GEMINI_API_KEY = "AIzaSyAxGw0arzRYw_VxnH73NIeK7wnOEJ28yLY";

// Componente del Spinner de carga
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-8 border-cyan-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-transparent border-t-cyan-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-xl font-bold text-center text-cyan-800 mt-6">Procesando...</p>
    </div>
);

export default function Inventory() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Estados principales
    const [step, setStep] = useState('flight_input'); // flight_input, category_selection, scanning, complete
    const [flightNumber, setFlightNumber] = useState('');
    const [inventoryData, setInventoryData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [scannedPhotos, setScannedPhotos] = useState([]);
    const [currentPhotoBase64, setCurrentPhotoBase64] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [completedCategories, setCompletedCategories] = useState([]);
    const [validationResult, setValidationResult] = useState(null);

    // Paso 1: Enviar número de vuelo al backend
    const handleSubmitFlightNumber = async () => {
        if (!flightNumber.trim()) {
            setError('Por favor ingresa un número de vuelo');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/inventory/flight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flight_number: flightNumber })
            });

            if (!response.ok) {
                throw new Error('Error al obtener inventario del vuelo');
            }

            const data = await response.json();
            setInventoryData(data);
            setStep('category_selection');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 2: Seleccionar categoría
    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        setScannedPhotos([]);
        setCurrentPhotoBase64(null);
        setStep('scanning');
        setError(null);
    };

    // Paso 3: Tomar foto
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setCurrentPhotoBase64(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Procesar foto con Gemini
    const handleProcessPhoto = async () => {
        if (!currentPhotoBase64) {
            setError('Por favor toma una foto primero');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const base64Data = currentPhotoBase64.split(',')[1];
            const mimeType = currentPhotoBase64.split(';')[0].split(':')[1];

            // Obtener el catálogo de nombres del inventario
            const catalogoNombres = inventoryData.catalogo_nombres || [];

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

            const schema = {
                type: "OBJECT",
                properties: {
                    categoria_escaneada: { type: "STRING" },
                    peso_total_medido_g: { type: "NUMBER" },
                    tipos_detectados_vision: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    }
                },
                required: ["categoria_escaneada", "peso_total_medido_g", "tipos_detectados_vision"]
            };

            const prompt = `Eres un asistente de inventario para una empresa de catering aéreo.

TAREA: Analiza la imagen de productos sobre una báscula y extrae la siguiente información:

1. categoria_escaneada: Determina si los productos son "comida", "bebida_no_alcoholica" o "bebida_alcoholica"
2. peso_total_medido_g: Lee el valor que marca la báscula en la imagen (en gramos, número entero)
3. tipos_detectados_vision: Identifica TODOS los tipos de productos visibles en la imagen

CATÁLOGO DE PRODUCTOS (usa estos nombres para identificar):
${catalogoNombres.join(', ')}

IMPORTANTE:
- La categoría debe ser exactamente una de: "comida", "bebida_no_alcoholica", "bebida_alcoholica"
- Para tipos_detectados_vision, usa los SKUs correspondientes como: "canelitas", "principe", "agua_600ml", "cerveza_nacional", etc.
- El peso debe ser el valor exacto que muestra la báscula

Responde ÚNICAMENTE con el formato JSON solicitado.`;

            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Error de Gemini: ${errorBody.error.message}`);
            }

            const result = await response.json();
            const jsonText = result.candidates[0].content.parts[0].text;
            const parsedResponse = JSON.parse(jsonText);

            // Agregar timestamp a la respuesta
            const photoData = {
                timestamp: new Date().toISOString(),
                imagen: currentPhotoBase64,
                ...parsedResponse
            };

            setScannedPhotos([...scannedPhotos, photoData]);
            setCurrentPhotoBase64(null);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Enviar todas las fotos al backend para validación
    const handleSendForValidation = async () => {
        if (scannedPhotos.length === 0) {
            setError('Debes tomar al menos una foto');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Preparar datos para el backend (sin las imágenes para reducir payload)
            const scannedData = scannedPhotos.map(photo => ({
                timestamp: photo.timestamp,
                categoria_escaneada: photo.categoria_escaneada,
                peso_total_medido_g: photo.peso_total_medido_g,
                tipos_detectados_vision: photo.tipos_detectados_vision
            }));

            const response = await fetch(`${BACKEND_URL}/api/inventory/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    flight_number: flightNumber,
                    scanned_data: scannedData
                })
            });

            if (!response.ok) {
                throw new Error('Error al validar inventario');
            }

            const result = await response.json();
            setValidationResult(result);

            // Si la validación fue exitosa, marcar categoría como completada
            if (result.validation_status === 'success') {
                setCompletedCategories([...completedCategories, selectedCategory]);

                // Verificar si completamos todas las categorías
                const totalCategories = Object.keys(inventoryData.orden_vuelo.categorias).length;
                if (completedCategories.length + 1 >= totalCategories) {
                    setStep('complete');
                } else {
                    // Volver a selección de categorías
                    setTimeout(() => {
                        setStep('category_selection');
                        setSelectedCategory(null);
                        setScannedPhotos([]);
                        setValidationResult(null);
                    }, 3000);
                }
            } else {
                // Si hay errores, mostrar y permitir volver a tomar fotos
                setTimeout(() => {
                    setScannedPhotos([]);
                    setValidationResult(null);
                }, 5000);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para reiniciar todo el proceso
    const handleReset = () => {
        setStep('flight_input');
        setFlightNumber('');
        setInventoryData(null);
        setSelectedCategory(null);
        setScannedPhotos([]);
        setCurrentPhotoBase64(null);
        setCompletedCategories([]);
        setValidationResult(null);
        setError(null);
    };

    // Mapeo de categorías a nombres legibles
    const categoryNames = {
        'comida': 'Comidas',
        'bebida_no_alcoholica': 'Bebidas No Alcohólicas',
        'bebida_alcoholica': 'Bebidas Alcohólicas'
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl">
                {/* Botón de regreso */}
                <button
                    onClick={() => navigate('/home')}
                    className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver al inicio
                </button>

                {/* Mascota águila con mensaje */}
                <div className="mb-8 animate-bounce-in">
                    <EagleMascot
                        message={
                            step === 'flight_input' ? '¡Ingresa el número de vuelo para comenzar!' :
                            step === 'category_selection' ? 'Selecciona la categoría a validar' :
                            step === 'scanning' ? 'Toma fotos de los productos en la báscula' :
                            '¡Inventario completo! Excelente trabajo.'
                        }
                        size="medium"
                    />
                </div>

                {/* Tarjeta principal */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                    {/* Cabecera */}
                    <header className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-6 text-center">
                        <h1 className="text-3xl font-bold text-white">Inventory System</h1>
                        <p className="text-sm text-cyan-100 mt-1">
                            {step === 'flight_input' && 'Análisis de inventario de vuelo'}
                            {step === 'category_selection' && `Vuelo: ${flightNumber}`}
                            {step === 'scanning' && `Vuelo: ${flightNumber} - ${categoryNames[selectedCategory]}`}
                            {step === 'complete' && 'Inventario Completo'}
                        </p>
                    </header>

                    {/* Contenido principal */}
                    <main className="p-8 min-h-[400px]">
                        {/* PASO 1: Ingresar número de vuelo */}
                        {step === 'flight_input' && (
                            <div className="flex flex-col gap-6 max-w-md mx-auto">
                                <div>
                                    <label htmlFor="flight-number" className="block text-xl font-bold text-blue-900 mb-4">
                                        Número de Vuelo
                                    </label>
                                    <input
                                        id="flight-number"
                                        type="text"
                                        value={flightNumber}
                                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                                        placeholder="Ej: AM241"
                                        className="w-full p-4 text-lg border-2 border-cyan-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        disabled={isLoading}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl">
                                        <p className="font-bold">Error</p>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                )}

                                {isLoading ? (
                                    <LoadingSpinner />
                                ) : (
                                    <button
                                        onClick={handleSubmitFlightNumber}
                                        className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                                    >
                                        Obtener Inventario
                                    </button>
                                )}
                            </div>
                        )}

                        {/* PASO 2: Selección de categoría */}
                        {step === 'category_selection' && inventoryData && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
                                    Selecciona una categoría para validar
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.keys(inventoryData.orden_vuelo.categorias).map((category) => {
                                        const isCompleted = completedCategories.includes(category);
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => !isCompleted && handleSelectCategory(category)}
                                                disabled={isCompleted}
                                                className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
                                                    isCompleted
                                                        ? 'bg-green-100 border-2 border-green-500 cursor-not-allowed'
                                                        : 'bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 border-2 border-cyan-300 hover:scale-105'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center mb-3">
                                                    {isCompleted ? (
                                                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-12 h-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-center text-blue-900">
                                                    {categoryNames[category]}
                                                </h3>
                                                <p className="text-sm text-blue-600 text-center mt-2">
                                                    {inventoryData.orden_vuelo.categorias[category].length} productos
                                                </p>
                                                {isCompleted && (
                                                    <p className="text-xs text-green-600 text-center mt-2 font-bold">
                                                        ✓ Completado
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {completedCategories.length > 0 && (
                                    <div className="bg-green-50 border-2 border-green-300 p-4 rounded-xl text-center">
                                        <p className="text-green-800 font-bold">
                                            Progreso: {completedCategories.length} / {Object.keys(inventoryData.orden_vuelo.categorias).length} categorías completadas
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PASO 3: Escaneo y validación */}
                        {step === 'scanning' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-center text-blue-900">
                                    {categoryNames[selectedCategory]}
                                </h2>

                                {/* Mostrar productos esperados */}
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <h3 className="font-bold text-blue-900 mb-2">Productos esperados:</h3>
                                    <ul className="space-y-1">
                                        {inventoryData.orden_vuelo.categorias[selectedCategory].map((producto) => (
                                            <li key={producto.sku} className="text-sm text-blue-700">
                                                • {producto.sku}: {producto.cantidad_requerida} unidades ({producto.peso_unitario_g}g c/u)
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Input de foto oculto */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {/* Vista previa de foto actual */}
                                {currentPhotoBase64 && (
                                    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-cyan-300">
                                        <img src={currentPhotoBase64} alt="Vista previa" className="w-full max-h-80 object-contain bg-gray-100" />
                                    </div>
                                )}

                                {/* Fotos ya procesadas */}
                                {scannedPhotos.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-blue-900">Fotos escaneadas: {scannedPhotos.length}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {scannedPhotos.map((photo, index) => (
                                                <div key={index} className="relative rounded-lg overflow-hidden shadow border border-green-300">
                                                    <img src={photo.imagen} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover" />
                                                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                                        ✓ {photo.peso_total_medido_g}g
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl">
                                        <p className="font-bold">Error</p>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                )}

                                {validationResult && (
                                    <div className={`p-4 rounded-xl border-2 ${
                                        validationResult.validation_status === 'success'
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-red-50 border-red-300'
                                    }`}>
                                        <p className={`font-bold ${
                                            validationResult.validation_status === 'success' ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                            {validationResult.overall_message}
                                        </p>
                                        {validationResult.errors.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {validationResult.errors.map((error, index) => (
                                                    <li key={index} className="text-sm text-red-700">
                                                        • {error.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {isLoading ? (
                                    <LoadingSpinner />
                                ) : (
                                    <div className="space-y-3">
                                        {!currentPhotoBase64 ? (
                                            <button
                                                onClick={triggerFileInput}
                                                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                            >
                                                📷 Tomar Foto
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleProcessPhoto}
                                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                            >
                                                ✓ Procesar Foto
                                            </button>
                                        )}

                                        {scannedPhotos.length > 0 && !validationResult && (
                                            <button
                                                onClick={handleSendForValidation}
                                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                            >
                                                Enviar para Validación ({scannedPhotos.length} fotos)
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setStep('category_selection')}
                                            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-xl transition-all"
                                        >
                                            Volver a Categorías
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PASO 4: Inventario completo */}
                        {step === 'complete' && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <svg className="w-32 h-32 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-green-600">
                                    ¡Inventario de vuelo completo!
                                </h2>
                                <p className="text-lg text-blue-700">
                                    Vuelo {flightNumber} - Todas las categorías validadas correctamente
                                </p>

                                <div className="bg-green-50 border-2 border-green-300 p-6 rounded-xl">
                                    <p className="text-green-800 font-bold text-lg mb-4">
                                        Categorías completadas:
                                    </p>
                                    <ul className="space-y-2">
                                        {completedCategories.map((cat) => (
                                            <li key={cat} className="text-green-700 flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {categoryNames[cat]}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={handleReset}
                                    className="w-full max-w-md mx-auto bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                >
                                    Procesar Nuevo Vuelo
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
