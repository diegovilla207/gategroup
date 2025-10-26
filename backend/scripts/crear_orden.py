#!/usr/bin/env python3
import snowflake.connector
import json
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- SNOWFLAKE CONFIGURATION ---
SNOWFLAKE_USER = os.getenv('SNOWFLAKE_USER')
SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')
SNOWFLAKE_ACCOUNT = os.getenv('SNOWFLAKE_ACCOUNT')
SNOWFLAKE_WAREHOUSE = os.getenv('SNOWFLAKE_WAREHOUSE')
SNOWFLAKE_DATABASE = os.getenv('SNOWFLAKE_DATABASE')
SNOWFLAKE_SCHEMA = os.getenv('SNOWFLAKE_SCHEMA')


def generar_json_orden_por_carritos(flight_number: str):
    """
    Se conecta a Snowflake y genera un JSON que contiene:
    1. La orden maestra del vuelo (agrupada por carrito).
    2. El número total de carritos en el vuelo.
    3. La lista completa de nombres de productos del catálogo.
    """

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
    conn = None

    try:
        # Conexión a Snowflake
        conn = snowflake.connector.connect(
            user=SNOWFLAKE_USER,
            password=SNOWFLAKE_PASSWORD,
            account=SNOWFLAKE_ACCOUNT,
            warehouse=SNOWFLAKE_WAREHOUSE,
            database=SNOWFLAKE_DATABASE,
            schema=SNOWFLAKE_SCHEMA
        )
        with conn.cursor() as cursor:

            # --- Ejecutar Consulta 1 (La Orden por Carritos) ---
            cursor.execute(sql_query_orden, (flight_number,))

            primera_fila = True
            for row in cursor:
                # Desempaca todas las columnas
                num_carritos_total, cart_id, cart_identifier, sku, cantidad, peso, tolerance = row

                if primera_fila:
                    json_final["total_carritos_en_vuelo"] = num_carritos_total
                    primera_fila = False

                item_data = {
                    "sku": sku,
                    "cantidad_requerida": cantidad,
                    "peso_unitario_g": float(peso),
                    "peso_tolerancia": float(tolerance)
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
            cursor.execute(sql_query_catalogo)

            for row in cursor:
                json_final["catalogo_nombres"].append(row[0])

    except Exception as e:
        print(json.dumps({"error": f"Error al conectar o consultar Snowflake: {str(e)}"}), file=sys.stderr)
        return None
    finally:
        if conn:
            conn.close()

    # Si la lista de carritos está vacía, significa que el vuelo no se encontró
    if not json_final["carritos"]:
        print(json.dumps({"error": f"Vuelo '{flight_number}' no encontrado o sin carritos asignados."}), file=sys.stderr)
        return None

    # Return the JSON directly instead of writing to file
    # The Node.js server will handle the response
    return json_final


# --- MAIN EXECUTION ---
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Número de vuelo no proporcionado"}))
        sys.exit(1)

    flight_number = sys.argv[1]
    result = generar_json_orden_por_carritos(flight_number)

    if result:
        print(json.dumps(result, ensure_ascii=False))
    else:
        sys.exit(1)
