import snowflake.connector
import json
import os

# 1. --- CONFIGURACIÓN DE SNOWFLAKE ---
# (Usa variables de entorno en un proyecto real, no hardcodees esto)
SNOWFLAKE_USER="Rosu76"
SNOWFLAKE_PASSWORD="HTC7fBxi3ZmafFV"
SNOWFLAKE_ACCOUNT="cucbppa-am55842"
SNOWFLAKE_WAREHOUSE="COMPUTE_WH"
SNOWFLAKE_DATABASE="CATERING_DB"
SNOWFLAKE_SCHEMA="PACKING_SCHEMA"

# 2. --- FUNCIÓN PARA OBTENER Y TRANSFORMAR LA ORDEN ---
def generar_json_orden_maestra_por_vuelo(flight_number: str):
    """
    Se conecta a Snowflake, obtiene la orden de un vuelo y
    la transforma en un JSON agrupado por categoría.
    """
    
    # Esta consulta SQL une las 3 tablas y filtra por el vuelo
    sql_query = """
    SELECT
        f.FLIGHT_NUMBER,
        p.CATEGORY,
        oi.PRODUCT_SKU,
        oi.CANTIDAD_REQUERIDA,
        p.PESO_UNITARIO_G
    FROM
        FLIGHTS f
    JOIN
        ORDER_ITEMS oi ON f.FLIGHT_ID = oi.FLIGHT_ID
    JOIN
        PRODUCTS p ON oi.PRODUCT_SKU = p.SKU
    WHERE
        f.FLIGHT_NUMBER = %s;
    """
    
    # --- Estructura base del JSON de salida ---
    orden_agrupada = {
        "flight_number": flight_number,
        "categorias": {
            "comida": [],
            "bebida_no_alcoholica": [],
            "bebida_alcoholica": []
        }
    }

    try:
        # Conexión a Snowflake
        with snowflake.connector.connect(
            user=SNOWFLAKE_USER,
            password=SNOWFLAKE_PASSWORD,
            account=SNOWFLAKE_ACCOUNT,
            warehouse=SNOWFLAKE_WAREHOUSE,
            database=SNOWFLAKE_DATABASE,
            schema=SNOWFLAKE_SCHEMA
        ) as conn:
            with conn.cursor() as cursor:
                # Ejecutar la consulta
                cursor.execute(sql_query, (flight_number,))
                
                # Procesar cada fila resultante
                for row in cursor:
                    flight_num, category, sku, cantidad, peso = row
                    
                    # Ignorar si la categoría no es una de las que esperamos
                    if category not in orden_agrupada["categorias"]:
                        continue
                        
                    # Crear el objeto del ítem
                    item = {
                        "sku": sku,
                        "cantidad_requerida": cantidad,
                        "peso_unitario_g": float(peso) # Convertir de Decimal a float
                    }
                    
                    # Añadir el ítem a su lista de categoría correspondiente
                    orden_agrupada["categorias"][category].append(item)
        
        # Guardar el JSON en un archivo
        output_filename = f"orden_{flight_number}.json"
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(orden_agrupada, f, indent=4, ensure_ascii=False)
            
        print(f"¡Éxito! Orden Maestra generada: {output_filename}")
        return orden_agrupada

    except Exception as e:
        print(f"Error al conectar o consultar Snowflake: {e}")
        return None

# 3. --- FUNCIÓN PARA GUARDAR EL REGISTRO (LO QUE SE ESCANEÓ) ---
def guardar_registro_scan(flight_number: str, datos_scan: dict):
    """
    Guarda los datos de un escaneo (lo que Gemini vio) 
    en un archivo de "registros".
    """
    
    registro_filename = f"registro_{flight_number}.json"
    
    # Intentar cargar registros existentes o crear una lista nueva
    try:
        with open(registro_filename, 'r') as f:
            registros = json.load(f)
    except FileNotFoundError:
        registros = [] # El archivo no existe, empezar de cero

    # Añadir el nuevo dato del scan a la lista
    registros.append(datos_scan)
    
    # Guardar la lista actualizada
    with open(registro_filename, 'w') as f:
        json.dump(registros, f, indent=4)
        
    print(f"¡Éxito! Registro guardado en: {registro_filename}")


# --- EJEMPLO DE USO ---

# === PARTE 1: El operario inicia su turno ===
print("--- Generando Orden Maestra ---")
vuelo_actual = "AM241"
json_orden_maestra = generar_json_orden_maestra_por_vuelo(vuelo_actual)

if json_orden_maestra:
    print("\nContenido del JSON de la Orden Maestra (para la App):")
    print(json.dumps(json_orden_maestra, indent=2))


# === PARTE 2: El operario llena el carrito de "comida" y toma la foto ===
# (Tu backend recibe esto de Gemini y la App)
print("\n--- Guardando Scan de 'Comida' ---")
scan_comida = {
    "timestamp": "2025-10-25T15:30:00Z",
    "categoria_escaneada": "comida",
    "peso_total_medido_g": 5970, # Ejemplo de peso
    "tipos_detectados_vision": ["canelitas", "principe"]
}
guardar_registro_scan(vuelo_actual, scan_comida)


# === PARTE 3: El operario llena el carrito de "bebidas" y toma la foto ===
print("\n--- Guardando Scan de 'Bebidas' ---")
scan_bebidas = {
    "timestamp": "2025-10-25T15:35:00Z",
    "categoria_escaneada": "bebida_no_alcoholica",
    "peso_total_medido_g": 12100, # Ejemplo de peso
    "tipos_detectados_vision": ["agua_600ml"] 
    # (Quizás Gemini no vio el jugo, tu lógica de análisis detectará esto)
}
guardar_registro_scan(vuelo_actual, scan_bebidas)