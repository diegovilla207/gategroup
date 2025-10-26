#!/usr/bin/env python3
"""
Script para validar inventario desde la API web.
Recibe el número de vuelo y los datos escaneados como argumentos de línea de comandos.
"""

import json
import sys
import itertools
from datetime import datetime
import snowflake.connector
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Peso de tara por caja (en gramos)
PESO_TARA_POR_CAJA_G = 721.0


def formatear_solucion(coeficientes, items):
    """
    Convierte una solución como (2, -1, 0) en un string legible.
    'items' es una lista de tuplas: [('sku', peso), ...]
    """
    reporte_partes = []
    for i, k in enumerate(coeficientes):
        if k == 0:
            continue

        sku = items[i][0]
        if k > 0:
            reporte_partes.append(f"Faltan {k} {sku}")
        else:
            reporte_partes.append(f"Sobran {abs(k)} {sku}")

    if not reporte_partes:
        return "Sugerencia: No se encontró una causa simple para la discrepancia."

    return "Sugerencia: " + ", ".join(reporte_partes) + "."


def resolver_discrepancia(diferencia_peso, items_plan):
    """
    Resuelve una discrepancia de peso compleja encontrando la combinación
    de items faltantes/sobrantes más simple que explique la diferencia.

    'items_plan' es un dict: {'sku': {'peso': 30}}
    """

    items = [(sku, data['peso']) for sku, data in items_plan.items()]
    if not items:
        return "Discrepancia de peso no identificada (no hay items en el plan)."

    for search_bound in [5, 10, 25]:
        search_range = range(-search_bound, search_bound + 1)

        mejor_solucion = None
        min_coste = float('inf')

        for coeficientes in itertools.product(search_range, repeat=len(items)):

            if all(c == 0 for c in coeficientes):
                continue

            suma_actual = sum(k * items[i][1] for i, k in enumerate(coeficientes))
            coste_actual = sum(abs(k) for k in coeficientes)

            if abs(suma_actual - diferencia_peso) < 1.0:

                if coste_actual < min_coste:
                    min_coste = coste_actual
                    mejor_solucion = coeficientes

        if mejor_solucion:
            return formatear_solucion(mejor_solucion, items)

    return "Discrepancia de peso compleja no identificada."


def obtener_orden_vuelo(flight_number):
    """
    Obtiene la orden del vuelo desde Snowflake
    """
    try:
        conn = snowflake.connector.connect(
            account=os.getenv('SNOWFLAKE_ACCOUNT'),
            user=os.getenv('SNOWFLAKE_USER'),
            password=os.getenv('SNOWFLAKE_PASSWORD'),
            database=os.getenv('SNOWFLAKE_DATABASE'),
            schema=os.getenv('SNOWFLAKE_SCHEMA'),
            warehouse=os.getenv('SNOWFLAKE_WAREHOUSE')
        )

        cursor = conn.cursor()

        # Obtener información del vuelo y sus carritos
        query = """
            SELECT DISTINCT
                fc.CART_ID,
                c.CART_IDENTIFIER,
                ip.SKU,
                ip.PESO_UNITARIO_G,
                ip.CANTIDAD,
                ip.PESO_TOLERANCIA_G
            FROM FLIGHT_CARTS fc
            JOIN CARTS c ON fc.CART_ID = c.CART_ID
            JOIN INVENTORY_PLAN ip ON fc.CART_ID = ip.CART_ID
            WHERE fc.FLIGHT_NUMBER = %s
            ORDER BY fc.CART_ID, ip.SKU
        """

        cursor.execute(query, (flight_number,))
        rows = cursor.fetchall()

        if not rows:
            cursor.close()
            conn.close()
            return None

        # Organizar datos por carrito
        carritos = {}
        for row in rows:
            cart_id = row[0]
            cart_identifier = row[1]
            sku = row[2]
            peso_unitario = row[3]
            cantidad = row[4]
            tolerancia = row[5]

            if cart_id not in carritos:
                carritos[cart_id] = {
                    'cart_id': cart_id,
                    'cart_identifier': cart_identifier,
                    'items_requeridos': []
                }

            carritos[cart_id]['items_requeridos'].append({
                'sku': sku,
                'peso_unitario_g': peso_unitario,
                'cantidad_requerida': cantidad,
                'peso_tolerancia': tolerancia
            })

        cursor.close()
        conn.close()

        return {
            'flight_number': flight_number,
            'carritos': list(carritos.values())
        }

    except Exception as e:
        print(f"Error conectando a Snowflake: {e}", file=sys.stderr)
        return None


def validar_inventario(flight_number, scanned_data):
    """
    Valida el inventario escaneado contra la orden del vuelo
    """

    # Obtener la orden del vuelo
    datos_orden = obtener_orden_vuelo(flight_number)

    if not datos_orden:
        return {
            "error": f"Vuelo '{flight_number}' no encontrado o sin carritos asignados."
        }

    # Crear el objeto de reporte final
    reporte_final = {
        "analysis_timestamp": datetime.now().isoformat(),
        "flight_number": flight_number,
        "peso_tara_asumido_por_caja_g": PESO_TARA_POR_CAJA_G,
        "reporte_carritos": []
    }

    plan_carritos = {
        carrito['cart_id']: carrito
        for carrito in datos_orden['carritos']
    }

    # Iterar sobre cada carrito escaneado
    for scan_carrito in scanned_data:
        cart_id = scan_carrito.get('cart_id', 'desconocido')
        try:
            cajas_escaneadas = scan_carrito.get('cajas_escaneadas', [])

            # Sumar peso y tipos detectados
            peso_medido_bruto_total = 0.0
            tipos_detectados_set = set()
            numero_de_cajas = 0

            if not cajas_escaneadas:
                reporte_final["reporte_carritos"].append({
                    "cart_id": cart_id,
                    "status": "ERROR",
                    "reporte": ["No se encontraron 'cajas_escaneadas' para este carrito."]
                })
                continue

            for caja in cajas_escaneadas:
                peso_caja = caja.get("peso_medido_g")
                if peso_caja is None:
                    print(f"Advertencia: Caja en carrito {cart_id} no tiene 'peso_medido_g'.", file=sys.stderr)
                else:
                    peso_medido_bruto_total += float(peso_caja)

                tipos_detectados_set.update(caja.get("tipos_detectados_vision", []))
                numero_de_cajas += 1

            # Calcular peso neto
            peso_tara_total_estimado = numero_de_cajas * PESO_TARA_POR_CAJA_G
            peso_medido_neto_total = max(0, peso_medido_bruto_total - peso_tara_total_estimado)

            resultado_carrito = {
                "cart_id": cart_id,
                "numero_cajas_escaneadas": numero_de_cajas,
                "peso_bruto_medido_g": round(peso_medido_bruto_total, 2),
                "peso_tara_estimado_g": round(peso_tara_total_estimado, 2),
                "peso_neto_medido_g": round(peso_medido_neto_total, 2),
                "status": "OK",
                "reporte": []
            }

            # Obtener el plan para este carrito
            plan = plan_carritos.get(cart_id)
            if not plan:
                resultado_carrito["status"] = "ERROR"
                resultado_carrito["reporte"].append(f"Se escaneó el cart_id {cart_id}, pero no estaba en la orden.")
                reporte_final["reporte_carritos"].append(resultado_carrito)
                continue

            # Calcular totales del plan
            peso_esperado_contenido = 0.0
            tolerancia_total = 0.0
            tipos_esperados_set = set()
            items_plan_dict = {}

            for item in plan["items_requeridos"]:
                peso_item = item.get("peso_unitario_g", 0) * item.get("cantidad_requerida", 0)
                peso_esperado_contenido += peso_item
                tolerancia_total += item.get("peso_tolerancia", 0)
                tipos_esperados_set.add(item["sku"])
                items_plan_dict[item["sku"]] = {"peso": item.get("peso_unitario_g", 0)}

            peso_esperado_contenido = round(peso_esperado_contenido, 2)
            tolerancia_total = round(tolerancia_total, 2)

            # Comparar tipos
            items_no_esperados = tipos_detectados_set - tipos_esperados_set
            items_no_detectados = tipos_esperados_set - tipos_detectados_set

            if items_no_esperados:
                resultado_carrito["status"] = "ERROR_VISUAL"
                resultado_carrito["reporte"].append(
                    f"Productos INCORRECTOS detectados: {sorted(list(items_no_esperados))}")
            if items_no_detectados:
                if resultado_carrito["status"] == "OK":
                    resultado_carrito["status"] = "WARNING_VISUAL"
                resultado_carrito["reporte"].append(
                    f"Productos FALTANTES (no vistos): {sorted(list(items_no_detectados))}")

            # Comparar peso neto vs peso esperado
            peso_min_esperado = peso_esperado_contenido - tolerancia_total
            peso_max_esperado = peso_esperado_contenido + tolerancia_total

            if not (peso_min_esperado <= peso_medido_neto_total <= peso_max_esperado):
                if resultado_carrito["status"] == "OK" or resultado_carrito["status"] == "WARNING_VISUAL":
                    resultado_carrito["status"] = "ERROR_PESO"

                diferencia = round(peso_esperado_contenido - peso_medido_neto_total, 2)
                signo = "Faltan" if diferencia > 0 else "Sobran"
                reporte_detallado = (
                    f"Discrepancia de peso (neto): {signo} {abs(diferencia)}g. "
                    f"(Esperado: {peso_esperado_contenido}g [Rango: {peso_min_esperado:.2f}g a {peso_max_esperado:.2f}g], "
                    f"Medido Neto: {peso_medido_neto_total:.2f}g)"
                )
                resultado_carrito["reporte"].append(reporte_detallado)

                sugerencia = resolver_discrepancia(diferencia, items_plan_dict)
                resultado_carrito["reporte"].append(sugerencia)

            # Si todo está OK
            if resultado_carrito["status"] == "OK":
                resultado_carrito["reporte"].append(
                    f"Carrito validado correctamente. Peso neto: {peso_medido_neto_total:.2f}g (Esperado: {peso_esperado_contenido}g)")

            reporte_final["reporte_carritos"].append(resultado_carrito)

        except KeyError as e:
            reporte_final["reporte_carritos"].append({
                "cart_id": cart_id,
                "status": "ERROR",
                "reporte": [f"Falta la clave {e} en el JSON."]
            })
        except Exception as e:
            reporte_final["reporte_carritos"].append({
                "cart_id": cart_id,
                "status": "ERROR",
                "reporte": [f"Error procesando registro: {str(e)}"]
            })

    return reporte_final


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Se requieren 2 argumentos: flight_number y scanned_data (JSON)"}), file=sys.stderr)
        sys.exit(1)

    flight_number = sys.argv[1]

    try:
        scanned_data = json.loads(sys.argv[2])
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"JSON inválido en scanned_data: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    # Ejecutar validación
    resultado = validar_inventario(flight_number, scanned_data)

    # Imprimir resultado
    print(json.dumps(resultado, ensure_ascii=False, indent=2))

    # Si hay error, salir con código 1
    if "error" in resultado:
        sys.exit(1)
