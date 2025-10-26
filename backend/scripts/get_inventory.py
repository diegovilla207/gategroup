#!/usr/bin/env python3
import os
import json
import sys
import snowflake.connector
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

def get_snowflake_connection():
    """
    Establece conexión con Snowflake usando variables de entorno.
    Retorna la conexión o None si falla.
    """
    try:
        conn = snowflake.connector.connect(
            user=os.getenv('SNOWFLAKE_USER'),
            password=os.getenv('SNOWFLAKE_PASSWORD'),
            account=os.getenv('SNOWFLAKE_ACCOUNT'),
            warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
            database=os.getenv('SNOWFLAKE_DATABASE'),
            schema=os.getenv('SNOWFLAKE_SCHEMA'),
            connect_timeout=30 # Timeout for connection
        )
        print("✅ Conexión a Snowflake exitosa.")
        return conn
    except Exception as e:
        print(f"❌ ERROR al conectar a Snowflake: {e}", file=sys.stderr) # Print errors to stderr
        return None

def get_inventory_for_flight(flight_number):
    """
    Consulta el inventario real para un vuelo específico desde Snowflake.
    Retorna el inventario en el formato JSON requerido ("orden combinada").
    """
    print(f"➡️ Solicitando orden para vuelo: {flight_number}")

    # Consulta 1: Obtiene la orden (incluye el total de carritos)
    sql_query_orden = """
    SELECT
        f.NUMERO_DE_CARRITOS, -- El total de carritos del vuelo
        c.CART_ID,
        c.CART_IDENTIFIER,
        p.SKU,
        ci.CANTIDAD_REQUERIDA,
        p.PESO_UNITARIO_G,
        p.PESO_TOLERANCIA
    FROM
        FLIGHTS f
    JOIN
        CARTS c ON f.FLIGHT_ID = c.FLIGHT_ID
    JOIN
        CART_ITEMS ci ON c.CART_ID = ci.CART_ID
    JOIN
        PRODUCTS p ON ci.PRODUCT_SKU = p.SKU
    WHERE
        f.FLIGHT_NUMBER = %s
    ORDER BY
        c.CART_ID;
    """

    # Consulta 2: Obtiene todos los nombres del catálogo
    sql_query_catalogo = "SELECT product_name FROM PRODUCTS ORDER BY product_name;"

    # Estructura base del JSON de salida
    json_final = {
        "flight_number": flight_number,
        "total_carritos_en_vuelo": 0,
        "carritos": [],
        "catalogo_nombres": []
    }

    carritos_dict = {}
    conn = None # Initialize conn

    try:
        conn = get_snowflake_connection()
        if not conn:
            # Error already printed by get_snowflake_connection
            return {"error": "No se pudo conectar a la base de datos."}

        with conn.cursor() as cursor:

            # --- Ejecutar Consulta 1 (La Orden por Carritos) ---
            print(f"   Ejecutando consulta de orden para {flight_number}...")
            cursor.execute(sql_query_orden, (flight_number,))

            primera_fila = True
            rows_orden = cursor.fetchall() # Obtener todas las filas
            print(f"   Consulta de orden devolvió {len(rows_orden)} filas.")

            # Si no hay filas, el vuelo no existe o no tiene carritos asignados
            if not rows_orden:
                 print(f"   ⚠️ Error: No se encontraron carritos para el vuelo '{flight_number}'.")
                 # Return specific error JSON
                 return {"error": f"Vuelo '{flight_number}' no encontrado o sin carritos asignados. Verifica que la orden exista."}

            # Procesar las filas de la orden
            for row in rows_orden:
                num_carritos_total, cart_id, cart_identifier, sku, cantidad, peso, tolerance = row

                if primera_fila:
                    json_final["total_carritos_en_vuelo"] = num_carritos_total
                    primera_fila = False

                item_data = {
                    "sku": sku,
                    "cantidad_requerida": cantidad,
                    "peso_unitario_g": float(peso) if peso is not None else 0.0,
                    "peso_tolerancia": float(tolerance) if tolerance is not None else 0.0
                }
                if cart_id not in carritos_dict:
                    carritos_dict[cart_id] = {
                        "cart_id": cart_id,
                        "cart_identifier": cart_identifier,
                        "items_requeridos": []
                    }
                carritos_dict[cart_id]["items_requeridos"].append(item_data)

            json_final["carritos"] = list(carritos_dict.values())

            # --- Ejecutar Consulta 2 (El Catálogo) ---
            print("   Ejecutando consulta de catálogo...")
            cursor.execute(sql_query_catalogo)
            rows_catalogo = cursor.fetchall()
            print(f"   Consulta de catálogo devolvió {len(rows_catalogo)} nombres.")
            json_final["catalogo_nombres"] = [row[0] for row in rows_catalogo]

        print(f"✅ Orden para '{flight_number}' generada con éxito.")
        return json_final

    except Exception as e:
        # Capturar cualquier otro error (DB, lógica)
        print(f"❌ ERROR al obtener inventario para {flight_number}: {e}", file=sys.stderr)
        # Return specific error JSON
        return {"error": f"Error interno al consultar la orden: {e}"}
    finally:
        # Asegurarse de cerrar la conexión
        if conn and not conn.is_closed():
            conn.close()
            print("   Conexión a Snowflake cerrada.")


if __name__ == "__main__":
    # Verifica si se pasó un número de vuelo como argumento
    if len(sys.argv) < 2:
        # Imprime el error como JSON a stdout
        print(json.dumps({"error": "Número de vuelo no proporcionado. Uso: python inventory.py <numero_de_vuelo>"}))
        sys.exit(1) # Termina con código de error

    flight_number = sys.argv[1].upper() # Convertir a mayúsculas por si acaso
    inventory = get_inventory_for_flight(flight_number)

    # Imprime el resultado (JSON de la orden o JSON de error) a stdout
    # ensure_ascii=False para manejar acentos correctamente si los hubiera
    print(json.dumps(inventory, indent=2, ensure_ascii=False))

    # Salir con código 0 si fue exitoso, 1 si hubo error en la función
    if isinstance(inventory, dict) and "error" in inventory:
        sys.exit(1)
    else:
        sys.exit(0)