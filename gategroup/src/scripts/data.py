# --- 1. TU "BASE DE DATOS" DE ÓRDENES MAESTRAS ---
# En un proyecto real, esto vendría de una base de datos.
# Para el hackathon, este diccionario (JSON) es perfecto.
ORDENES_MAESTRAS = {
    "AM241": {
        "canelitas": 100,
        "principe": 80,
        "cacahuates": 200
    },
    "IB6833": {
        "canelitas": 50,
        "principe": 50,
        "agua_600ml": 120
    },
    "AF011": {
        "croissant_jamon": 60,
        "jugo_naranja": 60,
        "galletas_surtidas": 40
    }
}

def obtener_orden_maestra(vuelo_id: str):
    """
    Busca una orden maestra en nuestra "base de datos" (diccionario).
    
    :param vuelo_id: El ID del vuelo (ej. "AM241")
    :return: Un diccionario con la orden, o None si no se encuentra.
    """
    print(f"--- Buscando orden para el vuelo: {vuelo_id} ---")
    
    # .get() es una forma segura de buscar en un diccionario.
    # Si no encuentra la clave (vuelo_id), devuelve None.
    orden = ORDENES_MAESTRAS.get(vuelo_id)
    
    if orden:
        print("Orden encontrada:")
        return orden
    else:
        print("Error: Vuelo no encontrado en la base de datos.")
        return None

# --- EJEMPLO DE CÓMO USAR EL PROGRAMA ---

# 1. El usuario (operario) te da un número de vuelo
vuelo_del_usuario = "AM241"

# 2. Tu programa busca esa orden
orden_actual = obtener_orden_maestra(vuelo_del_usuario)

if orden_actual:
    print(orden_actual)

print("-" * 20)

# 3. Prueba con un vuelo que no existe
vuelo_falso = "LH499"
orden_falsa = obtener_orden_maestra(vuelo_falso)
if orden_falsa:
    print(orden_falsa)