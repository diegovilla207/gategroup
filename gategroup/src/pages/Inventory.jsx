import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import EagleMascot from '../components/EagleMascot'; // Asumo que esto se quitará como en la petición anterior
import robotDown from '../assets/robot-down.png'; // O la ruta correcta
import { useSound } from '../hooks/useSound';

const BACKEND_URL = 'http://localhost:3001';
const GEMINI_API_KEY = "AIzaSyCah64WOowYWDi2HHcJ7U0D0ofzyCJKp2o";

// Componente del Spinner de carga
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-8 border-amber-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-xl font-bold text-center text-amber-100 mt-6">Procesando...</p>
    </div>
);

export default function Inventory() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Estados principales
    const [step, setStep] = useState('flight_input'); // flight_input, cart_selection, scanning, complete
    const [flightNumber, setFlightNumber] = useState('');
    const [inventoryData, setInventoryData] = useState(null);
    const [selectedCart, setSelectedCart] = useState(null);
    const [scannedPhotos, setScannedPhotos] = useState([]);
    const [currentPhotoBase64, setCurrentPhotoBase64] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [completedCarts, setCompletedCarts] = useState([]);
    const [validationResult, setValidationResult] = useState(null);
    const playButtonSound = useSound('/sounds/Sound-Button.mp3', { volume: 0.5 });

    // --- (Aquí van todas tus funciones: handleSubmitFlightNumber, handleSelectCart, handleImageUpload, etc. SIN CAMBIOS) ---
    // (Omitidas por brevedad, pero deben estar aquí)
    
    // Paso 1: Enviar número de vuelo al backend
    const handleSubmitFlightNumber = async () => {
        if (!flightNumber.trim()) {
            setError('Por favor ingresa un número de vuelo');
            return;
        }
        await playButtonSound();
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
            setStep('cart_selection');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 2: Seleccionar carrito
    const handleSelectCart = async (cart) => {
        await playButtonSound();
        setSelectedCart(cart);
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

    const triggerFileInput = async () => {
        await playButtonSound();
        fileInputRef.current.click();
    };

    // Procesar foto con Gemini
    const handleProcessPhoto = async () => {
        if (!currentPhotoBase64) {
            setError('Por favor toma una foto primero');
            return;
        }
        await playButtonSound();
        setIsLoading(true);
        setError(null);
        try {
            const base64Data = currentPhotoBase64.split(',')[1];
            const mimeType = currentPhotoBase64.split(';')[0].split(':')[1];
            const catalogoCompleto = inventoryData.catalogo_nombres || [];
            const productosEsperadosDetalle = selectedCart.items_requeridos.map(item =>
                `"${item.sku}" (${item.cantidad_requerida} unidades)`
            ).join(', ');
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
            const schema = {
                type: "OBJECT",
                properties: {
                    peso_medido_g: {
                        type: "NUMBER",
                        description: "Peso EXACTO mostrado en la báscula en gramos"
                    },
                    tipos_detectados_vision: {
                        type: "ARRAY",
                        items: {
                            type: "STRING",
                            enum: catalogoCompleto
                        },
                        description: "Array de SKUs EXACTOS del catálogo que identificaste en la imagen"
                    }
                },
                required: ["peso_medido_g", "tipos_detectados_vision"]
            };
            const prompt = `Eres un asistente de inventario para catering aéreo. Tu trabajo es analizar la imagen y extraer información EXACTA.

🎯 TU TAREA:
1. Lee el PESO EXACTO que muestra la báscula digital en la imagen (en gramos)
2. Identifica TODOS los productos visibles en la imagen

📋 PRODUCTOS ESPERADOS EN ESTE CARRITO:
${productosEsperadosDetalle}

📚 CATÁLOGO COMPLETO DE SKUs VÁLIDOS (USA SOLO ESTOS):
${catalogoCompleto.join(', ')}

⚠️ REGLAS CRÍTICAS:
1. Para "tipos_detectados_vision", debes usar EXACTAMENTE los SKUs del catálogo
2. Ejemplos CORRECTOS: "canelitas_35g", "principe_49g", "agua_mineral_ciel_363g", "jugo_valle_naranja_1l"
3. ❌ NUNCA uses nombres incompletos como "canelitas", "principe", "agua" - SIEMPRE incluye el sufijo completo
4. Si ves galletas Príncipe, usa "principe_49g" (NO "principe")
5. Si ves galletas Canelitas, usa "canelitas_35g" (NO "canelitas")
6. Si ves agua Ciel, usa "agua_mineral_ciel_363g" (NO "agua" o "ciel")
7. Si ves jugo Valle, usa "jugo_valle_naranja_1l" (NO "jugo" o "valle")
8. El peso debe ser el número EXACTO de la báscula (ejemplo: 2942, 4766, etc.)
9. Busca TODOS los productos visibles, incluso si hay varios del mismo tipo
10. Compara cada producto con el catálogo y elige el SKU que MÁS SE PAREZCA

🔍 PROCESO:
1. Mira la báscula → lee el número → ese es "peso_medido_g"
2. Mira cada producto → busca en el catálogo el nombre más similar → usa ese SKU COMPLETO
3. Lista TODOS los SKUs que identificaste (sin repetir)

Responde SOLO con el JSON en el formato especificado.`;
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
                    responseSchema: schema,
                    temperature: 0.1
                }
            };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Error de Gemini: ${errorBody.error?.message || 'Error desconocido'}`);
            }
            const result = await response.json();
            const jsonText = result.candidates[0].content.parts[0].text;
            const parsedResponse = JSON.parse(jsonText);
            if (!parsedResponse.peso_medido_g || !Array.isArray(parsedResponse.tipos_detectados_vision)) {
                throw new Error('Gemini devolvió un formato incorrecto. Intenta de nuevo.');
            }
            const skusInvalidos = parsedResponse.tipos_detectados_vision.filter(
                sku => !catalogoCompleto.includes(sku)
            );
            if (skusInvalidos.length > 0) {
                console.warn('SKUs no encontrados en catálogo:', skusInvalidos);
                parsedResponse.tipos_detectados_vision = parsedResponse.tipos_detectados_vision.map(sku => {
                    if (!catalogoCompleto.includes(sku)) {
                        const skuSimilar = catalogoCompleto.find(catalogoSku =>
                            catalogoSku.toLowerCase().includes(sku.toLowerCase()) ||
                            sku.toLowerCase().includes(catalogoSku.toLowerCase().split('_')[0])
                        );
                        return skuSimilar || sku;
                    }
                    return sku;
                }).filter(sku => catalogoCompleto.includes(sku));
            }
            const photoData = {
                imagen: currentPhotoBase64,
                peso_medido_g: parsedResponse.peso_medido_g,
                tipos_detectados_vision: parsedResponse.tipos_detectados_vision
            };
            console.log('✅ Foto procesada correctamente:', photoData);
            setScannedPhotos([...scannedPhotos, photoData]);
            setCurrentPhotoBase64(null);
        } catch (err) {
            console.error('❌ Error procesando foto:', err);
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
        await playButtonSound();
        setIsLoading(true);
        setError(null);
        try {
            const scannedData = [{
                cart_id: selectedCart.cart_id,
                cajas_escaneadas: scannedPhotos.map(photo => ({
                    peso_medido_g: photo.peso_medido_g,
                    tipos_detectados_vision: photo.tipos_detectados_vision
                }))
            }];
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
            const cartReport = result.reporte_carritos[0];
            if (cartReport.status === 'OK') {
                setCompletedCarts([...completedCarts, selectedCart.cart_id]);
                if (completedCarts.length + 1 >= inventoryData.total_carritos_en_vuelo) {
                    setStep('complete');
                } else {
                    setTimeout(() => {
                        setStep('cart_selection');
                        setSelectedCart(null);
                        setScannedPhotos([]);
                        setValidationResult(null);
                    }, 3000);
                }
            } else {
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
    const handleReset = async () => {
        await playButtonSound();
        setStep('flight_input');
        setFlightNumber('');
        setInventoryData(null);
        setSelectedCart(null);
        setScannedPhotos([]);
        setCurrentPhotoBase64(null);
        setCompletedCarts([]);
        setValidationResult(null);
        setError(null);
    };
    
    // --- FIN DE FUNCIONES ---

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl">
                {/* Botón de regreso */}
                <button
                    onClick={() => navigate('/home')}
                    className="mb-4 flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver al inicio
                </button>


                {/* Tarjeta principal */}
                <div className="bg-gray-800 border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                    {/* Cabecera */}
                    <header className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center">
                        <h1 className="text-3xl font-bold text-white">Inventory System</h1>
                        <p className="text-sm text-amber-100 mt-1">
                            {step === 'flight_input' && 'Análisis de inventario de vuelo'}
                            {step === 'cart_selection' && `Vuelo: ${flightNumber}`}
                            {step === 'scanning' && `Vuelo: ${flightNumber} - ${selectedCart?.cart_identifier}`}
                            {step === 'complete' && 'Inventario Completo'}
                        </p>
                    </header>

                    {/* Contenido principal */}
                    <main className="p-8 min-h-[400px]">
                        
                        {/* ... (Aquí va tu código para 'flight_input' y 'cart_selection' SIN CAMBIOS) ... */}

                        {/* PASO 1: Ingresar número de vuelo */}
                        {step === 'flight_input' && (
                            <div className="flex flex-col gap-6 max-w-md mx-auto">
                                <div>
                                    <label htmlFor="flight-number" className="block text-xl font-bold text-white mb-4">
                                        Número de Vuelo
                                    </label>
                                    <input
                                        id="flight-number"
                                        type="text"
                                        value={flightNumber}
                                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                                        placeholder="Ej: AM241"
                                        className="w-full p-4 text-lg bg-gray-700 border-2 border-amber-500/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-400"
                                        disabled={isLoading}
                                    />
                                </div>
                                {error && (
                                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl">
                                        <p className="font-bold">Error</p>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                )}
                                {isLoading ? (
                                    <LoadingSpinner />
                                ) : (
                                    <button
                                        onClick={handleSubmitFlightNumber}
                                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                                    >
                                        Obtener Inventario
                                    </button>
                                )}
                            </div>
                        )}

                        {/* PASO 2: Selección de carrito */}
                        {step === 'cart_selection' && inventoryData && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        Selecciona un carrito para validar
                                    </h2>
                                    <p className="text-amber-400">
                                        Total de carritos en el vuelo: {inventoryData.total_carritos_en_vuelo}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {inventoryData.carritos.map((cart) => {
                                        const isCompleted = completedCarts.includes(cart.cart_id);
                                        return (
                                            <button
                                                key={cart.cart_id}
                                                onClick={() => !isCompleted && handleSelectCart(cart)}
                                                disabled={isCompleted}
                                                className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
                                                    isCompleted
                                                        ? 'bg-green-900/50 border border-green-500 cursor-not-allowed'
                                                        : 'bg-gray-700 hover:bg-gray-600 border border-amber-500/30 hover:border-amber-500 hover:scale-105'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center mb-3">
                                                    {isCompleted ? (
                                                        <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-center text-white">
                                                    {cart.cart_identifier}
                                                </h3>
                                                <p className="text-sm text-gray-300 text-center mt-2">
                                                    {cart.items_requeridos.length} productos
                                                </p>
                                                {isCompleted && (
                                                    <p className="text-xs text-green-400 text-center mt-2 font-bold">
                                                        ✓ Completado
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {completedCarts.length > 0 && (
                                    <div className="bg-green-900/50 border border-green-500 p-4 rounded-xl text-center">
                                        <p className="text-green-200 font-bold">
                                            Progreso: {completedCarts.length} / {inventoryData.total_carritos_en_vuelo} carritos completados
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PASO 3: Escaneo y validación */}
                        {step === 'scanning' && selectedCart && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-center text-white">
                                    {selectedCart.cart_identifier}
                                </h2>

                                {/* === INICIO DE SECCIÓN MODIFICADA === */}
                                
                                {/* Mostrar productos esperados (Diseño mejorado) */}
                                <div className="bg-gray-900/50 border-2 border-amber-500/30 p-4 sm:p-6 rounded-2xl shadow-inner backdrop-blur-sm">
                                    <h3 className="font-bold text-amber-400 mb-4 text-lg sm:text-xl uppercase tracking-wider flex items-center gap-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M10 16h.01" /></svg>
                                        Checklist de Carrito
                                    </h3>
                                    
                                    {/* Contenedor con scroll para listas largas */}
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 sm:pr-4">
                                        {selectedCart.items_requeridos.map((producto) => (
                                            <div 
                                                key={producto.sku} 
                                                className="flex justify-between items-center bg-gray-700/80 p-3 sm:p-4 rounded-xl shadow-md transition-all duration-200 hover:bg-gray-700"
                                            >
                                                {/* Lado izquierdo: Info del producto */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white text-base sm:text-lg truncate" title={producto.sku}>
                                                        {producto.sku}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {producto.peso_unitario_g}g / unidad
                                                    </p>
                                                </div>
                                                
                                                {/* Lado derecho: Cantidad (muy llamativa) */}
                                                <div className="flex-shrink-0 ml-4 text-right">
                                                    <span className="font-extrabold text-amber-400 text-2xl sm:text-3xl" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.4)' }}>
                                                        {producto.cantidad_requerida}
                                                    </span>
                                                    <span className="text-gray-400 text-xs sm:text-sm ml-1 uppercase font-medium">unid.</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* === FIN DE SECCIÓN MODIFICADA === */}


                                {/* Input de foto oculto */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {/* ... (Resto de tu código para 'scanning' SIN CAMBIOS) ... */}
                                
                                {/* Vista previa de foto actual */}
                                {currentPhotoBase64 && (
                                    <div className="rounded-xl overflow-hidden shadow-lg border border-amber-500/30">
                                        <img src={currentPhotoBase64} alt="Vista previa" className="w-full max-h-80 object-contain bg-gray-700" />
                                    </div>
                                )}

                                {/* Fotos ya procesadas */}
                                {scannedPhotos.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-white">Fotos escaneadas: {scannedPhotos.length}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {scannedPhotos.map((photo, index) => (
                                                <div key={index} className="relative rounded-lg overflow-hidden shadow border border-green-500">
                                                    <img src={photo.imagen} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover" />
                                                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                                        ✓ {photo.peso_medido_g}g
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl">
                                        <p className="font-bold">Error</p>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                )}

                                {validationResult && (
                                    <div className={`p-4 rounded-xl border ${
                                        validationResult.reporte_carritos[0].status === 'OK'
                                            ? 'bg-green-900/50 border-green-500'
                                            : 'bg-red-900/50 border-red-500'
                                    }`}>
                                        <p className={`font-bold ${
                                            validationResult.reporte_carritos[0].status === 'OK' ? 'text-green-200' : 'text-red-200'
                                        }`}>
                                            {validationResult.reporte_carritos[0].reporte[0]}
                                        </p>
                                        {validationResult.reporte_carritos[0].reporte.length > 1 && (
                                            <ul className="mt-2 space-y-1">
                                                {validationResult.reporte_carritos[0].reporte.slice(1).map((msg, index) => (
                                                    <li key={index} className="text-sm text-red-300">
                                                        • {msg}
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
                                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
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
                                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                            >
                                                Enviar para Validación ({scannedPhotos.length} fotos)
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setStep('cart_selection')}
                                            className="w-full bg-gray-700 hover:bg-gray-600 border border-amber-500/30 text-white font-medium py-3 px-6 rounded-xl transition-all"
                                        >
                                            Volver a Carritos
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ... (Aquí va tu código para 'complete' SIN CAMBIOS) ... */}

                        {/* PASO 4: Inventario completo */}
                        {step === 'complete' && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <svg className="w-32 h-32 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-green-400">
                                    ¡Inventario de vuelo completo!
                                </h2>
                                <p className="text-lg text-gray-300">
                                    Vuelo {flightNumber} - Todos los carritos validados correctamente
                                </p>
                                <div className="bg-green-900/50 border border-green-500 p-6 rounded-xl">
                                    <p className="text-green-200 font-bold text-lg mb-4">
                                        Carritos completados: {completedCarts.length} / {inventoryData?.total_carritos_en_vuelo}
                                    </p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="w-full max-w-md mx-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all"
                                >
                                    Escanear Otro Vuelo
                                </button>
                            </div>
                        )}
                        
                    </main>
                </div>
            </div>
        </div>
    );
}