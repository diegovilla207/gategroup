#!/usr/bin/env python3
import snowflake.connector
import json
import sys
import os
from datetime import date
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

# --- DEFAULT VALUES (MASTER ORDER) ---
ORDEN_MAESTRA_AM241 = {
    "sandwich_pavo": 150, "canelitas": 100, "principe": 80,
    "cacahuates": 200, "agua_600ml": 200, "refresco_cola": 150,
    "cerveza_nacional": 50, "vino_tinto_187ml": 40
}
MAX_ITEMS_POR_CARRITO = 300


# --- CART DISTRIBUTION LOGIC ---
def repartir_carritos(orden_maestra, limite_items):
    """
    Toma la orden total y la divide en una lista de carritos.
    """
    print(f"Iniciando reparto. Límite de {limite_items} ítems por carrito.")
    lista_de_carritos = []
    current_cart_items = {}
    current_cart_count = 0
    items_ordenados = sorted(orden_maestra.items(), key=lambda item: item[1], reverse=True)

    for sku, cantidad in items_ordenados:
        if (current_cart_count + cantidad) <= limite_items:
            current_cart_items[sku] = cantidad
            current_cart_count += cantidad
        else:
            if current_cart_items:
                lista_de_carritos.append(current_cart_items)
            current_cart_items = {sku: cantidad}
            current_cart_count = cantidad

    if current_cart_items:
        lista_de_carritos.append(current_cart_items)

    print(f"Reparto finalizado. Se generaron {len(lista_de_carritos)} carritos.")
    return lista_de_carritos


# --- DATABASE LOGIC ---
def mandar_orden_a_db(flight_number, departure_date_str, orden_maestra, limite_items):
    """
    Toma la orden maestra, la reparte, borra la orden vieja (si existe)
    e inserta la nueva orden, incluyendo el NÚMERO DE CARRITOS en el vuelo.
    """

    lista_de_carritos = repartir_carritos(orden_maestra, limite_items)
    numero_total_carritos = len(lista_de_carritos)

    print("\n--- PLAN DE REPARTO GENERADO ---")
    for i, carrito in enumerate(lista_de_carritos):
        print(f"  Carrito {i + 1}: Total ítems: {sum(carrito.values())} -> {carrito}")

    conn = None
    try:
        conn = snowflake.connector.connect(
            user=SNOWFLAKE_USER, password=SNOWFLAKE_PASSWORD,
            account=SNOWFLAKE_ACCOUNT, warehouse=SNOWFLAKE_WAREHOUSE,
            database=SNOWFLAKE_DATABASE, schema=SNOWFLAKE_SCHEMA
        )
        cursor = conn.cursor()
        print(f"\nConectado a Snowflake. Mandando orden para {flight_number}...")

        # Borrar orden vieja
        cursor.execute("SELECT flight_id FROM Flights WHERE flight_number = %s AND departure_date = %s",
                       (flight_number, departure_date_str))
        resultado = cursor.fetchone()

        if resultado:
            old_flight_id = resultado[0]
            print(f"Vuelo anterior encontrado (ID: {old_flight_id}). Borrando orden vieja...")
            cursor.execute("DELETE FROM Scan_Records WHERE cart_id IN (SELECT cart_id FROM Carts WHERE flight_id = %s)",
                           (old_flight_id,))
            cursor.execute("DELETE FROM Cart_Items WHERE cart_id IN (SELECT cart_id FROM Carts WHERE flight_id = %s)",
                           (old_flight_id,))
            cursor.execute("DELETE FROM Carts WHERE flight_id = %s", (old_flight_id,))
            cursor.execute("DELETE FROM Flights WHERE flight_id = %s", (old_flight_id,))
            print("Orden vieja borrada.")
        else:
            print(
                f"No existe orden previa para el vuelo {flight_number} en la fecha {departure_date_str}. Se creará una nueva.")

        # Crear el nuevo vuelo
        cursor.execute(
            "INSERT INTO Flights (flight_number, departure_date, numero_de_carritos) VALUES (%s, %s, %s)",
            (flight_number, departure_date_str, numero_total_carritos)
        )
        cursor.execute("SELECT MAX(flight_id) FROM Flights;")
        new_flight_id = cursor.fetchone()[0]
        print(f"Nuevo vuelo creado con flight_id: {new_flight_id} (Total Carritos: {numero_total_carritos})")

        # Insertar carritos y sus ítems
        cart_counter = 1
        for carrito_items in lista_de_carritos:
            cart_identifier = f"Carrito {cart_counter} - Mixto"
            cursor.execute("INSERT INTO Carts (flight_id, cart_identifier) VALUES (%s, %s)",
                           (new_flight_id, cart_identifier))

            cursor.execute("SELECT MAX(cart_id) FROM Carts;")
            new_cart_id = cursor.fetchone()[0]
            print(f"  > Creando {cart_identifier} (cart_id: {new_cart_id})...")

            for sku, cantidad in carrito_items.items():
                cursor.execute(
                    "INSERT INTO Cart_Items (cart_id, product_sku, cantidad_requerida) VALUES (%s, %s, %s)",
                    (new_cart_id, sku, cantidad)
                )
            cart_counter += 1

        conn.commit()
        print("\n¡Éxito! Nueva orden enviada a Snowflake.")
        return {"success": True, "message": f"Orden creada para vuelo {flight_number}", "num_carritos": numero_total_carritos}

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\nError: {e}", file=sys.stderr)
        return {"success": False, "error": str(e)}
    finally:
        if conn:
            conn.close()


# --- SCRIPT EXECUTION ---
if __name__ == "__main__":
    if len(sys.argv) < 3:
        VUELO_A_MANDAR = "AM241"
        FECHA_DEL_VUELO = "2025-10-25"  # Formato YYYY-MM-DD
        ORDEN_A_MANDAR = ORDEN_MAESTRA_AM241
    else:
        VUELO_A_MANDAR = sys.argv[1]
        FECHA_DEL_VUELO = sys.argv[2]
        # For custom orders, you would parse sys.argv[3] as JSON
        ORDEN_A_MANDAR = ORDEN_MAESTRA_AM241

    result = mandar_orden_a_db(
        VUELO_A_MANDAR,
        FECHA_DEL_VUELO,
        ORDEN_A_MANDAR,
        MAX_ITEMS_POR_CARRITO
    )

    print(json.dumps(result, ensure_ascii=False))
