import json
import itertools
import os
import sys
from datetime import datetime


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


def analizar_registros(orden_file, registro_file):
    """
    Compara la orden (plan) con el registro (realidad).
    El registro debe ser una lista de carritos, cada uno
    conteniendo una lista de 'cajas_escaneadas'.
    """

    # 1. Cargar los archivos JSON
    try:
        with open(orden_file, 'r', encoding='utf-8') as f:
            datos_orden = json.load(f)
        with open(registro_file, 'r', encoding='utf-8') as f:
            datos_registro = json.load(f)  # El registro es una LISTA de carritos
    except FileNotFoundError as e:
        return {"error": f"No se encontró el archivo {e.filename}"}
    except json.JSONDecodeError as e:
        return {"error": f"El archivo JSON está mal formateado. {e}"}

    # --- 2. CREAR EL OBJETO DE REPORTE FINAL ---
    reporte_final = {
        "analysis_timestamp": datetime.now().isoformat(),
        "orden_file": orden_file,
        "registro_file": registro_file,
        "reporte_carritos": []
    }

    plan_carritos = {
        carrito['cart_id']: carrito
        for carrito in datos_orden['carritos']
    }

    # 3. Iterar sobre CADA CARRITO guardado en el archivo de registro
    for scan_carrito in datos_registro:
        # Define 'cart_id' fuera del 'try' para usarlo en el 'except'
        cart_id = scan_carrito.get('cart_id', 'desconocido')
        try:
            cajas_escaneadas = scan_carrito.get('cajas_escaneadas', [])

            # --- A. AGREGAR LA "REALIDAD" DEL SCAN (SUMAR LAS CAJAS) ---
            peso_medido_total = 0.0
            tipos_detectados_set = set()  # Define la variable CORRECTA

            if not cajas_escaneadas:
                reporte_final["reporte_carritos"].append({
                    "cart_id": cart_id,
                    "status": "ERROR",
                    "reporte": ["No se encontraron 'cajas_escaneadas' para este carrito."]
                })
                continue

            for caja in cajas_escaneadas:
                peso_medido_total += caja.get("peso_medido_g", 0)
                # Lee 'tipos_detectados_vision' del JSON
                tipos_detectados_set.update(caja.get("tipos_detectados_vision", []))

            resultado_carrito = {
                "cart_id": cart_id,
                "status": "OK",
                "reporte": []
            }

            # --- B. OBTENER EL "PLAN" PARA ESTE CARRITO ---
            plan = plan_carritos.get(cart_id)
            if not plan:
                resultado_carrito["status"] = "ERROR"
                resultado_carrito["reporte"].append(f"Se escaneó el cart_id {cart_id}, pero no estaba en la orden.")
                reporte_final["reporte_carritos"].append(resultado_carrito)
                continue

            # --- C. CALCULAR TOTALES DEL "PLAN" ---
            peso_esperado_total = 0.0
            tolerancia_total = 0.0
            tipos_esperados_set = set()
            items_plan_dict = {}

            for item in plan["items_requeridos"]:
                peso_esperado_total += item["peso_unitario_g"] * item["cantidad_requerida"]
                tolerancia_total += item["peso_tolerancia"]
                tipos_esperados_set.add(item["sku"])
                items_plan_dict[item["sku"]] = {"peso": item["peso_unitario_g"]}

            # --- D. COMPARAR Y GENERAR REPORTE ---

            # Usa 'tipos_detectados_set' (la variable correcta)
            items_no_esperados = tipos_detectados_set - tipos_esperados_set
            items_no_detectados = tipos_esperados_set - tipos_detectados_set

            if items_no_esperados:
                resultado_carrito["status"] = "ERROR_VISUAL"
                resultado_carrito["reporte"].append(f"Productos INCORRECTOS detectados: {list(items_no_esperados)}")
            if items_no_detectados:
                resultado_carrito["status"] = "ERROR_VISUAL"
                resultado_carrito["reporte"].append(f"Productos FALTANTES (no vistos): {list(items_no_detectados)}")

            # Chequeo 2: Peso
            peso_min_esperado = peso_esperado_total - tolerancia_total
            peso_max_esperado = peso_esperado_total + tolerancia_total

            if not (peso_min_esperado <= peso_medido_total <= peso_max_esperado):
                resultado_carrito["status"] = "ERROR_PESO"
                diferencia = round(peso_esperado_total - peso_medido_total, 2)
                signo = "Faltan" if diferencia > 0 else "Sobran"
                reporte_detallado = (
                    f"Discrepancia de peso: {signo} {abs(diferencia)}g. "
                    f"(Esperado: {peso_esperado_total}g [Rango: {peso_min_esperado}g a {peso_max_esperado}g], "
                    f"Medido: {peso_medido_total}g)"
                )
                resultado_carrito["reporte"].append(reporte_detallado)

                sugerencia = resolver_discrepancia(diferencia, items_plan_dict)
                resultado_carrito["reporte"].append(sugerencia)

            if resultado_carrito["status"] == "OK":
                resultado_carrito["reporte"].append(
                    f"Peso correcto (Esperado: {peso_esperado_total}g, Medido: {peso_medido_total}g)")

            reporte_final["reporte_carritos"].append(resultado_carrito)

        except KeyError as e:
            reporte_final["reporte_carritos"].append(
                {"cart_id": cart_id, "error": f"Falta la clave {e} en uno de los registros del JSON."})
        except Exception as e:
            # Aquí es donde se captura tu error (que ahora está corregido)
            reporte_final["reporte_carritos"].append(
                {"cart_id": cart_id, "error": f"Error procesando un registro: {e}"})

    return reporte_final


# --- EJEMPLO DE CÓMO USAR EL SCRIPT ---
if __name__ == "__main__":

    # --- 1. DEFINE LOS NOMBRES DE TUS ARCHIVOS ---
    archivo_orden = "orden_por_carritos_AM241.json"
    archivo_registro = "registro_AM241.json"

    # --- 2. EJECUTAR EL ANÁLISIS ---
    print(f"\n--- Analizando {archivo_orden} con {archivo_registro} ---")

    if not os.path.exists(archivo_orden):
        print(f"Error: El archivo de orden '{archivo_orden}' no existe.")
        print("Por favor, ejecuta 'crear_orden.py' primero.")
        sys.exit(1)

    if not os.path.exists(archivo_registro):
        print(f"Error: El archivo de registro '{archivo_registro}' no existe.")
        print("Por favor, crea un 'registro_AM241.json' de prueba.")
        sys.exit(1)

    reporte = analizar_registros(archivo_orden, archivo_registro)

    if isinstance(reporte, dict) and "error" in reporte:
        print(f"ERROR: {reporte['error']}")
        sys.exit(1)

    print("\n--- REPORTE FINAL ---")
    print(json.dumps(reporte, indent=2))