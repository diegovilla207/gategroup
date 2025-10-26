import snowflake.connector
import json
import os
from datetime import date

# 1. --- CONFIGURACIÓN DE SNOWFLAKE ---
# (¡REVISA CADA LÍNEA! AQUÍ PUEDE ESTAR EL ERROR)
SNOWFLAKE_USER="Rosu76"
SNOWFLAKE_PASSWORD="E4A7Fg58HwVzQh!"
SNOWFLAKE_ACCOUNT="cucbppa-am55842"
SNOWFLAKE_WAREHOUSE="COMPUTE_WH"
SNOWFLAKE_DATABASE="GATE_GROUP_INVENTORY"
SNOWFLAKE_SCHEMA="MAIN"

# 2. --- VALORES DE PRUEBA (ORDEN MAESTRA) ---
ORDEN_MAESTRA_AM241 = {
    "sandwich_pavo": 150, "canelitas": 100, "principe": 80,
    "cacahuates": 200, "agua_600ml": 200, "refresco_cola": 150,
    "cerveza_nacional": 50, "vino_tinto_187ml": 40
}
MAX_ITEMS_POR_CARRITO = 300


# 3. --- LÓGICA DE REPARTO ---
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


# 4. --- LÓGICA DE BASE DE DATOS ---
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
        # CORRECCIÓN: Usar MAX() para obtener el ID en Snowflake
        cursor.execute("SELECT MAX(flight_id) FROM Flights;")
        new_flight_id = cursor.fetchone()[0]
        print(f"Nuevo vuelo creado con flight_id: {new_flight_id} (Total Carritos: {numero_total_carritos})")

        # Insertar carritos y sus ítems
        cart_counter = 1
        for carrito_items in lista_de_carritos:
            cart_identifier = f"Carrito {cart_counter} - Mixto"
            cursor.execute("INSERT INTO Carts (flight_id, cart_identifier) VALUES (%s, %s)",
                           (new_flight_id, cart_identifier))

            # CORRECCIÓN: Usar MAX() para obtener el ID en Snowflake
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

    except Exception as e:
        if conn: conn.rollback()
        print(f"\nError: {e}")
    finally:
        if conn: conn.close()


# 5. --- EJECUCIÓN DEL SCRIPT ---
if __name__ == "__main__":
    VUELO_A_MANDAR = "AM241"
    FECHA_DEL_VUELO = "2025-10-25"  # Formato YYYY-MM-DD
    ORDEN_A_MANDAR = ORDEN_MAESTRA_AM241

    mandar_orden_a_db(
        VUELO_A_MANDAR,
        FECHA_DEL_VUELO,
        ORDEN_A_MANDAR,
        MAX_ITEMS_POR_CARRITO
    )