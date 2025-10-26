import uvicorn
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

# --- IMPORTANTE: IMPORTAR TUS SCRIPTS DE LÓGICA ---
# Asegúrate de que estos archivos .py estén en la misma carpeta que main.py
import crear_orden
import analizar_registro

# --- 2. INICIALIZACIÓN DE FASTAPI Y CORS ---
app = FastAPI(
    title="Inventory API",
    description="API que utiliza la lógica de carritos de los scripts originales.",
    version="2.0.0"
)

# El frontend corre en un puerto diferente (3000 o 5173)
# y el backend en 3001. CORS es necesario.
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173", # Puerto común de Vite/React
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. MODELOS DE DATOS (PYDANTIC) ---
# Estos modelos validan los JSON que envía el frontend (React)

class FlightRequest(BaseModel):
    """El JSON esperado en /api/inventory/flight"""
    flight_number: str

# Modelos para el JSON que envía React en la validación
# Coinciden con el formato que 'analizar_registro.py' espera en su archivo JSON
class ScannedBox(BaseModel):
    peso_medido_g: float
    tipos_detectados_vision: List[str]

class ScannedCart(BaseModel):
    cart_id: int # Snowflake usa IDs numéricos
    cajas_escaneadas: List[ScannedBox]

class ValidateRequest(BaseModel):
    """El JSON esperado en /api/inventory/validate"""
    flight_number: str
    # React ahora envía la estructura exacta que 'analizar_registro' necesita
    registro_data: List[ScannedCart] 


# --- 4. ENDPOINTS DE LA API ---

@app.get("/")
def read_root():
    return {"status": "Inventory API (Lógica de Carritos) está en línea"}


@app.post("/api/inventory/flight")
async def get_flight_inventory(request: FlightRequest):
    """
    Endpoint para obtener el "Plan".
    1. Llama a 'crear_orden.py' para generar el JSON de la orden.
    2. Lee ese archivo JSON.
    3. Devuelve el contenido a React.
    """
    try:
        # 1. Llama a tu script original.
        # Esta función CREA el archivo "orden_por_carritos_VUELO.json"
        # y devuelve el nombre del archivo.
        print(f"Llamando a crear_orden.py para el vuelo: {request.flight_number}")
        filename = crear_orden.generar_json_orden_por_carritos(request.flight_number)
        
        if filename is None:
            print(f"Error: 'crear_orden.py' no pudo encontrar el vuelo {request.flight_number}")
            raise HTTPException(status_code=404, detail=f"Vuelo '{request.flight_number}' no encontrado o no tiene carritos asignados.")
        
        print(f"Archivo de orden generado: {filename}")
        
        # 2. Lee el contenido del archivo JSON recién creado
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 3. Opcional: Borrar el archivo si no quieres que se acumulen
        # os.remove(filename) 
        
        # 4. Devuelve el JSON completo a React
        return data
        
    except FileNotFoundError:
         raise HTTPException(status_code=404, detail=f"Vuelo '{request.flight_number}' no encontrado en la base de datos.")
    except Exception as e:
        print(f"Error en /api/inventory/flight: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/inventory/validate")
async def validate_inventory(request: ValidateRequest):
    """
    Endpoint para validar el "Registro" (lo escaneado) vs el "Plan" (la orden).
    1. Obtiene el 'flight_number' y 'registro_data' de React.
    2. 'registro_data' YA VIENE en el formato que 'analizar_registro.py' espera.
    3. Escribe 'registro_data' en un archivo JSON temporal.
    4. Llama a 'analizar_registro.py' usando el archivo de orden y el temporal.
    5. Borra el archivo temporal.
    6. Devuelve el resultado del análisis a React.
    """
    
    # El archivo "Plan" (Orden) que 'crear_orden.py' generó
    orden_file = f"orden_por_carritos_{request.flight_number}.json"
    
    # El 'cart_id' que estamos validando (React solo envía uno a la vez)
    cart_id_validando = request.registro_data[0].cart_id
    
    # Un nombre de archivo temporal único para el "Registro" (Escan)
    registro_file = f"temp_registro_{request.flight_number}_{cart_id_validando}.json"

    print(f"Iniciando validación para cart_id: {cart_id_validando}")
    print(f"Plan (Orden): {orden_file}")
    print(f"Registro (Scan): {registro_file}")

    # 1. Verificar que el archivo "Plan" (orden) exista
    if not os.path.exists(orden_file):
        print(f"Error: No se encontró el archivo de orden {orden_file}")
        raise HTTPException(status_code=404, detail=f"No se encontró el archivo de orden '{orden_file}'. Vuelva a cargar el vuelo desde el inicio.")
    
    # 2. Escribir los datos de escaneo de React en un archivo "Registro" temporal
    try:
        with open(registro_file, 'w', encoding='utf-8') as f:
            # request.registro_data es una lista de ScannedCart
            # .model_dump() (o .dict() en Pydantic v1) los convierte a dicts de Python
            json_data = [cart.model_dump() for cart in request.registro_data]
            json.dump(json_data, f, indent=4)
        print(f"Archivo de registro temporal creado: {registro_file}")
            
    except Exception as e:
        print(f"Error al escribir archivo temporal: {e}")
        raise HTTPException(status_code=500, detail=f"Error al escribir archivo temporal: {e}")

    # 3. Llamar al script de análisis original
    try:
        # ¡Aquí ocurre la magia! Llamamos a tu lógica original.
        reporte_completo = analizar_registro.analizar_registros(orden_file, registro_file)
        
        print("Análisis de 'analizar_registro.py' completado.")
        
        # 4. Borrar el archivo temporal (limpieza)
        if os.path.exists(registro_file):
            os.remove(registro_file)
            print(f"Archivo temporal borrado: {registro_file}")

        # 5. Analizar el reporte y formatear la respuesta para React
        if "error" in reporte_completo:
            raise HTTPException(status_code=500, detail=reporte_completo["error"])
        
        if not reporte_completo.get("reporte_carritos"):
             raise HTTPException(status_code=500, detail="Análisis fallido, no se generó reporte de carritos.")

        # Extraemos el reporte del único carrito que React envió a analizar
        cart_report = reporte_completo["reporte_carritos"][0]
        
        if cart_report.get("status") == "OK":
            # ¡Éxito!
            return {
                "validation_status": "success",
                "overall_message": cart_report.get("reporte", ["OK"])[0], # "Peso correcto..."
                "errors": []
            }
        else:
            # Hay un error (ERROR_PESO, ERROR_VISUAL, etc.)
            return {
                "validation_status": "error",
                "overall_message": "Se encontraron discrepancias en el carrito.",
                # Manda todos los mensajes de error del reporte
                "errors": [{"type": cart_report.get("status", "ERROR"), "message": msg} for msg in cart_report.get("reporte", [])]
            }

    except Exception as e:
        # Asegurarse de borrar el temporal incluso si el análisis falla
        if os.path.exists(registro_file):
            os.remove(registro_file)
        
        print(f"Error durante la ejecución de analizar_registro: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error al ejecutar el análisis: {e}")


# --- 5. PUNTO DE ENTRADA ---
if __name__ == "__main__":
    # El puerto 3001 coincide con el BACKEND_URL en tu archivo de React
    print(f"Iniciando servidor FastAPI en http://localhost:3001")
    print("Asegúrate de que 'crear_orden.py' y 'analizar_registro.py' estén en esta carpeta.")
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)