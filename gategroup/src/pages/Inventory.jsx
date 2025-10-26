import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EagleMascot from '../components/EagleMascot';

const BACKEND_URL = 'http://localhost:3001';
// Clave de API de Gemini (Mover a .env en producción)
const GEMINI_API_KEY = "AIzaSyAxGw0arzRYw_VxnH73NIeK7wnOEJ28yLY";

// Componente del Spinner de carga (sin cambios)
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

    // --- ESTADOS PRINCIPALES (MODIFICADOS) ---
    const [step, setStep] = useState('flight_input'); // flight_input, cart_selection, scanning, complete
    const [flightNumber, setFlightNumber] = useState('');
    
    // Almacena la respuesta de /api/inventory/flight (que ahora contiene la lista de carritos)
    const [inventoryData, setInventoryData] = useState(null); 
    
    // Almacena el objeto del carrito que se está escaneando actualmente
    const [selectedCart, setSelectedCart] = useState(null); // <-- CAMBIO: de category a cart
    
    // Almacena los datos de las cajas/fotos procesadas por Gemini
    const [scannedBoxes, setScannedBoxes] = useState([]); // <-- CAMBIO: de photos a boxes
    
    const [currentPhotoBase64, setCurrentPhotoBase64] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Almacena los cart_id de los carritos ya validados
    const [completedCarts, setCompletedCarts] = useState([]); // <-- CAMBIO: de categories a carts
    
    const [validationResult, setValidationResult] = useState(null);

    // --- PASO 1: ENVIAR NÚMERO DE VUELO (SIN CAMBIOS) ---
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
                const errData = await response.json();
                throw new Error(errData.detail || 'Error al obtener inventario del vuelo');
            }

            const data = await response.json();
            setInventoryData(data); // data ahora contiene { ..., carritos: [], catalogo_nombres: [] }
            setStep('cart_selection'); // <-- CAMBIO: de category_selection a cart_selection
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- PASO 2: SELECCIONAR CARRITO ---
    const handleSelectCart = (cart) => {
        setSelectedCart(cart); // cart es el objeto { cart_id, cart_identifier, items_requeridos: [] }
        setScannedBoxes([]); // <-- CAMBIO
        setCurrentPhotoBase64(null);
        setValidationResult(null);
        setError(null);
        setStep('scanning');
    };

    // --- PASO 3: LÓGICA DE ESCANEO ---
    
    // handleImageUpload y triggerFileInput (sin cambios)
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setCurrentPhotoBase64(e.target.result);
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Procesar foto con Gemini (MODIFICADO)
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

            // Usamos el catálogo de nombres que vino de 'crear_orden.py'
            const catalogoNombres = inventoryData.catalogo_nombres || [];

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            // Este es el schema que 'analizar_registro.py' necesita
            const schema = {
                type: "OBJECT",
                properties: {
                    peso_medido_g: { type: "NUMBER" },
                    tipos_detectados_vision: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    }
                },
                required: ["peso_medido_g", "tipos_detectados_vision"]
            };

            const prompt = `Eres un asistente de inventario para catering aéreo.

TAREA: Analiza la imagen de productos sobre una báscula y extrae:

1. peso_medido_g: Lee el valor que marca la báscula (en gramos, número)
2. tipos_detectados_vision: Identifica TODOS los tipos de productos visibles.

CATÁLOGO DE PRODUCTOS (Usa estos SKUs para identificar):
${catalogoNombres.join(', ')}

IMPORTANTE:
- Para tipos_detectados_vision, usa los SKUs: "canelitas", "principe", "agua_600ml", etc.
- El peso debe ser el valor numérico de la báscula.

Responde ÚNICAMENTE con el formato JSON solicitado.`;

            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: mimeType, data: base64Data } }
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

            // --- CAMBIO CLAVE ---
            // 'analizar_registro.py' no necesita la imagen, solo los datos.
            // Creamos el objeto 'caja' exactamente como el script lo espera.
            const boxData = {
                peso_medido_g: parsedResponse.peso_medido_g,
                tipos_detectados_vision: parsedResponse.tipos_detectados_vision
                // No guardamos 'categoria_escaneada' ni 'timestamp'
                // porque 'analizar_registro.py' no los usa.
            };

            // Guardamos la caja en el estado 'scannedBoxes'
            setScannedBoxes([...scannedBoxes, boxData]);
            setCurrentPhotoBase64(null); // Limpiar la vista previa

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Enviar datos del CARRITO al backend para validación (MODIFICADO)
    const handleSendForValidation = async () => {
        if (scannedBoxes.length === 0) {
            setError('Debes tomar al menos una foto (escanear al menos una caja)');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // --- CAMBIO CLAVE ---
            // Construimos el payload EXACTAMENTE como 'main.py' lo espera,
            // que a su vez es el formato que 'analizar_registro.py' espera.
            const validationPayload = {
                flight_number: flightNumber,
                registro_data: [ // 'analizar_registro' espera una LISTA de carritos
                    {
                        cart_id: selectedCart.cart_id,
                        cajas_escaneadas: scannedBoxes // Esta es nuestra lista de cajas
                    }
                ]
            };

            const response = await fetch(`${BACKEND_URL}/api/inventory/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validationPayload) // Envía el payload nuevo
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Error al validar inventario');
            }

            const result = await response.json();
            setValidationResult(result);

            // Si la validación fue exitosa (status "OK" del script)
            if (result.validation_status === 'success') {
                setCompletedCarts([...completedCarts, selectedCart.cart_id]); // <-- CAMBIO

                // Verificar si completamos todos los carritos
                const totalCarts = inventoryData.carritos.length;
                if (completedCarts.length + 1 >= totalCarts) {
                    setStep('complete');
                } else {
                    // Volver a selección de carritos
                    setTimeout(() => {
                        setStep('cart_selection'); // <-- CAMBIO
                        setSelectedCart(null);
                        setScannedBoxes([]);
                        setValidationResult(null);
                    }, 3000);
                }
            } else {
                // Si hay errores, mostrar y permitir volver a tomar fotos
                // (limpia las cajas para re-escanear)
                setTimeout(() => {
                    setScannedBoxes([]);
                    setValidationResult(null);
                }, 5000); // 5 segundos para leer el error
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para reiniciar todo el proceso (sin cambios)
    const handleReset = () => {
        setStep('flight_input');
        setFlightNumber('');
        setInventoryData(null);
        setSelectedCart(null); // <-- CAMBIO
        setScannedBoxes([]); // <-- CAMBIO
        setCurrentPhotoBase64(null);
        setCompletedCarts([]); // <-- CAMBIO
        setValidationResult(null);
        setError(null);
    };


    // --- RENDERIZACIÓN (MODIFICADA) ---
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl">
                {/* Botón de regreso */}
                <button
                    onClick={() => navigate('/')}
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
                            step === 'cart_selection' ? 'Selecciona el carrito a validar' : // <-- CAMBIO
                            step === 'scanning' ? 'Toma fotos de las cajas en la báscula' :
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
                            {step === 'cart_selection' && `Vuelo: ${flightNumber}`} {/* <-- CAMBIO */}
                            {step === 'scanning' && `Vuelo: ${flightNumber} - ${selectedCart?.cart_identifier || 'Carrito'}`} {/* <-- CAMBIO */}
                            {step === 'complete' && 'Inventario Completo'}
                        </p>
                    </header>

                    {/* Contenido principal */}
                    <main className="p-8 min-h-[400px]">
                        
                        {/* PASO 1: Ingresar número de vuelo (sin cambios) */}
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

                        {/* PASO 2: Selección de CARRITO (MODIFICADO) */}
                        {step === 'cart_selection' && inventoryData && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
                                    Selecciona un carrito para validar
                                </h2>
                                <p className="text-center text-blue-700">
                                    Total de carritos en el vuelo: {inventoryData.total_carritos_en_vuelo}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Mapea sobre 'inventoryData.carritos' en lugar de 'categorias' */}
                                    {inventoryData.carritos.map((cart) => {
                                        const isCompleted = completedCarts.includes(cart.cart_id);
                                        return (
                                            <button
                                                key={cart.cart_id}
                                                onClick={() => !isCompleted && handleSelectCart(cart)}
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
                                                    {cart.cart_identifier}
                                                </h3>
                                                <p className="text-sm text-blue-600 text-center mt-2">
                                                    {cart.items_requeridos.length} tipos de producto
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

                                {completedCarts.length > 0 && (
                                    <div className="bg-green-50 border-2 border-green-300 p-4 rounded-xl text-center">
                                        <p className="text-green-800 font-bold">
                                            Progreso: {completedCarts.length} / {inventoryData.carritos.length} carritos completados
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PASO 3: Escaneo y validación (MODIFICADO) */}
                        {step === 'scanning' && selectedCart && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-center text-blue-900">
                                    {selectedCart.cart_identifier} (ID: {selectedCart.cart_id})
                                </h2>

                                {/* Mostrar productos esperados PARA ESTE CARRITO */}
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <h3 className="font-bold text-blue-900 mb-2">Productos esperados en este carrito:</h3>
                                    <ul className="space-y-1">
                                        {selectedCart.items_requeridos.map((producto) => (
                                            <li key={producto.sku} className="text-sm text-blue-700">
                                                • {producto.sku}: {producto.cantidad_requerida} unidades ({producto.peso_unitario_g}g c/u)
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Input de foto oculto (sin cambios) */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {/* Vista previa de foto actual (sin cambios) */}
                                {currentPhotoBase64 && (
                                    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-cyan-300">
                                        <img src={currentPhotoBase64} alt="Vista previa" className="w-full max-h-80 object-contain bg-gray-100" />
                                    </div>
                                )}

                                {/* Cajas ya procesadas (MODIFICADO) */}
                                {scannedBoxes.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-blue-900">Cajas escaneadas: {scannedBoxes.length}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {scannedBoxes.map((box, index) => (
                                                <div key={index} className="p-3 rounded-lg shadow border border-green-300 bg-green-50 text-center">
                                                    <p className="font-bold text-green-800">Caja {index + 1}</p>
                                                    <p className="text-sm text-green-700">{box.peso_medido_g}g</p>
                                                    <p className="text-xs text-green-600 mt-1">({box.tipos_detectados_vision.join(', ') || 'Vacío'})</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Errores y Validación (sin cambios en la lógica, solo en el texto) */}
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
                                                📷 Tomar Foto (Caja {scannedBoxes.length + 1})
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleProcessPhoto}
                                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                            >
                                                ✓ Procesar Foto
                                            </button>
                                        )}

                                        {scannedBoxes.length > 0 && !validationResult && (
                                            <button
                                                onClick={handleSendForValidation}
                                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                            >
                                                Validar Carrito ({scannedBoxes.length} cajas)
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setStep('cart_selection')} // <-- CAMBIO
                                            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-xl transition-all"
                                        >
                                            Volver a Carritos
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PASO 4: Inventario completo (MODIFICADO) */}
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
                                    Vuelo {flightNumber} - Todos los carritos validados correctamente
                                </p>

                                <div className="bg-green-50 border-2 border-green-300 p-6 rounded-xl">
                                    <p className="text-green-800 font-bold text-lg mb-4">
                                        Carritos completados:
                                    </p>
                                    <ul className="space-y-2">
                                        {inventoryData.carritos.map((cart) => (
                                            <li key={cart.cart_id} className="text-green-700 flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {cart.cart_identifier}
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