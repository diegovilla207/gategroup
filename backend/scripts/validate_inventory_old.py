#!/usr/bin/env python3
import json
import sys

def validate_inventory(flight_number, scanned_data_list):
    """
    Valida el inventario escaneado contra el inventario esperado.

    scanned_data_list: Lista de objetos con la siguiente estructura:
    [
        {
            "timestamp": "2025-10-25T15:30:00Z",
            "categoria_escaneada": "comida",
            "peso_total_medido_g": 5970,
            "tipos_detectados_vision": ["canelitas", "principe"]
        },
        ...
    ]
    """

    # Importar el inventario esperado (reutilizamos la función del otro script)
    # En producción, esto podría ser una consulta a base de datos
    from get_inventory import get_inventory_for_flight

    inventory_data = get_inventory_for_flight(flight_number)
    orden_vuelo = inventory_data["orden_vuelo"]
    categorias = orden_vuelo["categorias"]

    validation_results = {
        "flight_number": flight_number,
        "validation_status": "pending",
        "categories_validated": [],
        "errors": [],
        "warnings": [],
        "overall_message": ""
    }

    # Procesar cada categoría escaneada
    for scanned_item in scanned_data_list:
        categoria = scanned_item["categoria_escaneada"]
        peso_medido = scanned_item["peso_total_medido_g"]
        tipos_detectados = scanned_item["tipos_detectados_vision"]
        timestamp = scanned_item.get("timestamp", "N/A")

        # Verificar que la categoría existe en el inventario esperado
        if categoria not in categorias:
            validation_results["errors"].append({
                "categoria": categoria,
                "message": f"Categoría '{categoria}' no existe en el inventario esperado",
                "timestamp": timestamp
            })
            continue

        # Obtener los productos esperados para esta categoría
        productos_esperados = categorias[categoria]

        # Calcular el peso total esperado
        peso_total_esperado = 0
        peso_tolerancia_total = 0
        productos_esperados_dict = {}

        for producto in productos_esperados:
            sku = producto["sku"]
            cantidad = producto["cantidad_requerida"]
            peso_unitario = producto["peso_unitario_g"]
            tolerancia = producto["peso_tolerancia"]

            peso_producto = cantidad * peso_unitario
            peso_total_esperado += peso_producto
            peso_tolerancia_total += (cantidad * tolerancia)

            productos_esperados_dict[sku] = {
                "cantidad_requerida": cantidad,
                "peso_unitario": peso_unitario,
                "peso_total": peso_producto,
                "tolerancia": tolerancia
            }

        # Calcular rangos aceptables
        peso_min = peso_total_esperado - peso_tolerancia_total
        peso_max = peso_total_esperado + peso_tolerancia_total

        # Validar el peso medido
        peso_status = "ok"
        peso_message = ""

        if peso_medido < peso_min:
            peso_status = "underweight"
            diferencia = peso_min - peso_medido
            peso_message = f"Peso insuficiente: faltan {diferencia:.1f}g (esperado: {peso_total_esperado:.1f}g ± {peso_tolerancia_total:.1f}g)"
        elif peso_medido > peso_max:
            peso_status = "overweight"
            diferencia = peso_medido - peso_max
            peso_message = f"Peso excedido: sobran {diferencia:.1f}g (esperado: {peso_total_esperado:.1f}g ± {peso_tolerancia_total:.1f}g)"
        else:
            peso_message = f"Peso correcto: {peso_medido:.1f}g (esperado: {peso_total_esperado:.1f}g ± {peso_tolerancia_total:.1f}g)"

        # Validar los tipos de productos detectados
        skus_esperados = set(productos_esperados_dict.keys())
        skus_detectados = set(tipos_detectados)

        skus_faltantes = skus_esperados - skus_detectados
        skus_extra = skus_detectados - skus_esperados

        tipos_status = "ok"
        tipos_messages = []

        if skus_faltantes:
            tipos_status = "missing_products"
            tipos_messages.append(f"Productos faltantes: {', '.join(skus_faltantes)}")

        if skus_extra:
            if tipos_status == "ok":
                tipos_status = "extra_products"
            tipos_messages.append(f"Productos extra: {', '.join(skus_extra)}")

        if not tipos_messages:
            tipos_messages.append("Todos los productos esperados fueron detectados")

        # Determinar el estado general de esta categoría
        categoria_status = "valid"
        if peso_status != "ok" or tipos_status != "ok":
            categoria_status = "invalid"

        # Agregar resultado de validación para esta categoría
        category_result = {
            "categoria": categoria,
            "timestamp": timestamp,
            "status": categoria_status,
            "peso": {
                "medido_g": peso_medido,
                "esperado_g": peso_total_esperado,
                "tolerancia_g": peso_tolerancia_total,
                "min_g": peso_min,
                "max_g": peso_max,
                "status": peso_status,
                "message": peso_message
            },
            "productos": {
                "detectados": list(skus_detectados),
                "esperados": list(skus_esperados),
                "faltantes": list(skus_faltantes),
                "extra": list(skus_extra),
                "status": tipos_status,
                "messages": tipos_messages
            }
        }

        validation_results["categories_validated"].append(category_result)

        # Agregar errores o warnings según corresponda
        if categoria_status == "invalid":
            if peso_status != "ok":
                validation_results["errors"].append({
                    "categoria": categoria,
                    "type": "peso",
                    "message": peso_message,
                    "timestamp": timestamp
                })
            if tipos_status != "ok":
                validation_results["errors"].append({
                    "categoria": categoria,
                    "type": "productos",
                    "message": "; ".join(tipos_messages),
                    "timestamp": timestamp
                })

    # Determinar el estado general de validación
    if validation_results["errors"]:
        validation_results["validation_status"] = "failed"
        validation_results["overall_message"] = "Se encontraron errores en el inventario. Por favor, corrija los problemas y vuelva a escanear."
    else:
        validation_results["validation_status"] = "success"
        validation_results["overall_message"] = "Inventario validado correctamente. Todos los productos están en orden."

    return validation_results

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Uso: python validate_inventory.py <flight_number> <scanned_data_json>"
        }))
        sys.exit(1)

    flight_number = sys.argv[1]
    scanned_data_json = sys.argv[2]

    try:
        scanned_data = json.loads(scanned_data_json)
    except json.JSONDecodeError as e:
        print(json.dumps({
            "error": f"Error al parsear JSON: {str(e)}"
        }))
        sys.exit(1)

    result = validate_inventory(flight_number, scanned_data)
    print(json.dumps(result, ensure_ascii=False, indent=2))
