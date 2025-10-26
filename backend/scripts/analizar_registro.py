import json
import itertools
import os
import sys
from datetime import datetime

# --- 1. ¡AJUSTA ESTE VALOR! ---
# Define el peso (en gramos) que asumes para CADA caja vacía
PESO_TARA_POR_CAJA_G = 721.0  # Ejemplo: 150 gramos por caja


# --- (Las funciones formatear_solucion y resolver_discrepancia no cambian) ---
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

            # Usar una tolerancia mayor (ej. 1g) puede ser necesario
            # si los pesos unitarios tienen decimales o hay pequeñas variaciones
            if abs(suma_actual - diferencia_peso) < 1.0:

                if coste_actual < min_coste:
                    min_coste = coste_actual
                    mejor_solucion = coeficientes

        if mejor_solucion:
            return formatear_solucion(mejor_solucion, items)

    return "Discrepancia de peso compleja no identificada."


def analizar_registros(orden_file, registro_file):
    """
    Compara la orden (plan) con el registro (realidad),
    restando el peso asumido de las cajas.
    """

    # 1. Cargar los archivos JSON
    try:
        with open(orden_file, 'r', encoding='utf-8') as f:
            datos_orden = json.load(f)
        with open(registro_file, 'r', encoding='utf-8') as f:
            datos_registro = json.load(f)
    except FileNotFoundError as e:
        return {"error": f"No se encontró el archivo {e.filename}"}
    except json.JSONDecodeError as e:
        return {"error": f"El archivo JSON está mal formateado. {e}"}

    # --- 2. CREAR EL OBJETO DE REPORTE FINAL ---
    reporte_final = {
        "analysis_timestamp": datetime.now().isoformat(),
        "orden_file": orden_file,
        "registro_file": registro_file,
        "peso_tara_asumido_por_caja_g": PESO_TARA_POR_CAJA_G,  # Informa qué peso se usó
        "reporte_carritos": []
    }

    plan_carritos = {
        carrito['cart_id']: carrito
        for carrito in datos_orden['carritos']
    }

    # 3. Iterar sobre CADA CARRITO guardado en el archivo de registro
    for scan_carrito in datos_registro:
        cart_id = scan_carrito.get('cart_id', 'desconocido')
        try:
            cajas_escaneadas = scan_carrito.get('cajas_escaneadas', [])

            # --- A. AGREGAR LA "REALIDAD" DEL SCAN (SUMAR LAS CAJAS) ---
            peso_medido_bruto_total = 0.0  # Peso CON cajas
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
                    # Decide cómo manejar esto: ¿ignorar la caja, dar error?
                    # Por ahora, la ignoramos para el peso pero contamos la caja.
                    print(f"Advertencia: Caja en carrito {cart_id} no tiene 'peso_medido_g'.")
                else:
                    peso_medido_bruto_total += float(peso_caja)

                tipos_detectados_set.update(caja.get("tipos_detectados_vision", []))
                numero_de_cajas += 1  # Contar cada entrada, incluso si no tenía peso

            # --- B. CALCULAR PESO NETO ---
            peso_tara_total_estimado = numero_de_cajas * PESO_TARA_POR_CAJA_G
            peso_medido_neto_total = peso_medido_bruto_total - peso_tara_total_estimado

            # Asegurarse de que el peso neto no sea negativo (podría pasar si la tara es muy alta)
            peso_medido_neto_total = max(0, peso_medido_neto_total)

            resultado_carrito = {
                "cart_id": cart_id,
                "numero_cajas_escaneadas": numero_de_cajas,
                "peso_bruto_medido_g": round(peso_medido_bruto_total, 2),
                "peso_tara_estimado_g": round(peso_tara_total_estimado, 2),
                "peso_neto_medido_g": round(peso_medido_neto_total, 2),  # <-- Peso a comparar
                "status": "OK",
                "reporte": []
            }

            # --- C. OBTENER EL "PLAN" PARA ESTE CARRITO ---
            plan = plan_carritos.get(cart_id)
            if not plan:
                resultado_carrito["status"] = "ERROR"
                resultado_carrito["reporte"].append(f"Se escaneó el cart_id {cart_id}, pero no estaba en la orden.")
                reporte_final["reporte_carritos"].append(resultado_carrito)
                continue

            # --- D. CALCULAR TOTALES DEL "PLAN" (Peso esperado de CONTENIDO) ---
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

            # Redondear para consistencia
            peso_esperado_contenido = round(peso_esperado_contenido, 2)
            tolerancia_total = round(tolerancia_total, 2)

            # --- E. COMPARAR Y GENERAR REPORTE ---
            # Comparar tipos
            items_no_esperados = tipos_detectados_set - tipos_esperados_set
            items_no_detectados = tipos_esperados_set - tipos_detectados_set

            if items_no_esperados:
                resultado_carrito["status"] = "ERROR_VISUAL"
                resultado_carrito["reporte"].append(
                    f"Productos INCORRECTOS detectados: {sorted(list(items_no_esperados))}")
            if items_no_detectados:
                if resultado_carrito["status"] == "OK":  # Solo marcar si no hay otro error visual
                    resultado_carrito["status"] = "WARNING_VISUAL"  # O ERROR_VISUAL si quieres ser más estricto
                resultado_carrito["reporte"].append(
                    f"Productos FALTANTES (no vistos): {sorted(list(items_no_detectados))}")

            # Comparar peso NETO vs peso de CONTENIDO esperado
            peso_min_esperado = peso_esperado_contenido - tolerancia_total
            peso_max_esperado = peso_esperado_contenido + tolerancia_total

            # Usar el peso NETO calculado
            if not (peso_min_esperado <= peso_medido_neto_total <= peso_max_esperado):
                # Marcar como error si no había ya uno visual más grave
                if resultado_carrito["status"] == "OK" or resultado_carrito["status"] == "WARNING_VISUAL":
                    resultado_carrito["status"] = "ERROR_PESO"

                # Calcular diferencia usando PESO NETO
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

            # Si después de todo, el status sigue OK
            if resultado_carrito["status"] == "OK":
                resultado_carrito["reporte"].append(
                    f"Peso neto correcto (Esperado: {peso_esperado_contenido}g, Medido Neto: {peso_medido_neto_total:.2f}g)")

            reporte_final["reporte_carritos"].append(resultado_carrito)

        except KeyError as e:
            reporte_final["reporte_carritos"].append({"cart_id": cart_id, "error": f"Falta la clave {e} en el JSON."})
        except Exception as e:
            reporte_final["reporte_carritos"].append({"cart_id": cart_id, "error": f"Error procesando registro: {e}"})

    return reporte_final


# --- EJEMPLO DE CÓMO USAR EL SCRIPT ---
if __name__ == "__main__":

    # --- 1. DEFINE LOS NOMBRES DE TUS ARCHIVOS ---
    archivo_orden = "orden_por_carritos_AM241.json"
    archivo_registro = "registro_AM241.json"

    # --- 2. EJECUTAR EL ANÁLISIS ---
    print(f"\n--- Analizando {archivo_orden} con {archivo_registro} ---")
    print(f"--- Asumiendo un peso tara por caja de: {PESO_TARA_POR_CAJA_G}g ---")

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
    # Imprimir con ensure_ascii=False para caracteres especiales si los hubiera
    print(json.dumps(reporte, indent=2, ensure_ascii=False))