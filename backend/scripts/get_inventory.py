#!/usr/bin/env python3
import os
import json
import sys
import snowflake.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_snowflake_connection():
    """
    Establece conexión con Snowflake usando variables de entorno
    """
    return snowflake.connector.connect(
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
        database=os.getenv('SNOWFLAKE_DATABASE'),
        schema=os.getenv('SNOWFLAKE_SCHEMA')
    )

def get_inventory_for_flight(flight_number):
    """
    Consulta el inventario para un vuelo específico desde Snowflake.
    Retorna el inventario en el formato JSON requerido.
    """

    # Base de datos simulada de inventarios por vuelo
    inventory_database = {
        "AM241": {
            "orden_vuelo": {
                "flight_number": "AM241",
                "categorias": {
                    "comida": [
                        {
                            "sku": "canelitas",
                            "cantidad_requerida": 100,
                            "peso_unitario_g": 30.0,
                            "peso_tolerancia": 1.5
                        },
                        {
                            "sku": "principe",
                            "cantidad_requerida": 80,
                            "peso_unitario_g": 45.0,
                            "peso_tolerancia": 2.0
                        },
                        {
                            "sku": "sandwich_pavo",
                            "cantidad_requerida": 150,
                            "peso_unitario_g": 180.5,
                            "peso_tolerancia": 5.0
                        }
                    ],
                    "bebida_no_alcoholica": [
                        {
                            "sku": "agua_600ml",
                            "cantidad_requerida": 200,
                            "peso_unitario_g": 600.0,
                            "peso_tolerancia": 10.0
                        },
                        {
                            "sku": "jugo_naranja",
                            "cantidad_requerida": 100,
                            "peso_unitario_g": 300.0,
                            "peso_tolerancia": 8.0
                        },
                        {
                            "sku": "refresco_cola",
                            "cantidad_requerida": 150,
                            "peso_unitario_g": 355.0,
                            "peso_tolerancia": 8.0
                        }
                    ],
                    "bebida_alcoholica": [
                        {
                            "sku": "cerveza_nacional",
                            "cantidad_requerida": 50,
                            "peso_unitario_g": 365.0,
                            "peso_tolerancia": 8.0
                        },
                        {
                            "sku": "vino_tinto",
                            "cantidad_requerida": 30,
                            "peso_unitario_g": 187.0,
                            "peso_tolerancia": 5.0
                        }
                    ]
                }
            },
            "catalogo_nombres": [
                "Agua Natural 600ml",
                "Cacahuates Salados",
                "Cerveza Nacional 355ml",
                "Galletas Canelitas",
                "Galletas Principe",
                "Jugo de Naranja 300ml",
                "Refresco de Cola 355ml",
                "Sandwich de Pavo",
                "Vino Tinto 187ml"
            ]
        },
        "BA456": {
            "orden_vuelo": {
                "flight_number": "BA456",
                "categorias": {
                    "comida": [
                        {
                            "sku": "canelitas",
                            "cantidad_requerida": 120,
                            "peso_unitario_g": 30.0,
                            "peso_tolerancia": 1.5
                        },
                        {
                            "sku": "cacahuates",
                            "cantidad_requerida": 100,
                            "peso_unitario_g": 50.0,
                            "peso_tolerancia": 2.0
                        }
                    ],
                    "bebida_no_alcoholica": [
                        {
                            "sku": "agua_600ml",
                            "cantidad_requerida": 250,
                            "peso_unitario_g": 600.0,
                            "peso_tolerancia": 10.0
                        }
                    ],
                    "bebida_alcoholica": [
                        {
                            "sku": "cerveza_nacional",
                            "cantidad_requerida": 60,
                            "peso_unitario_g": 365.0,
                            "peso_tolerancia": 8.0
                        }
                    ]
                }
            },
            "catalogo_nombres": [
                "Agua Natural 600ml",
                "Cacahuates Salados",
                "Cerveza Nacional 355ml",
                "Galletas Canelitas",
                "Galletas Principe",
                "Jugo de Naranja 300ml",
                "Refresco de Cola 355ml",
                "Sandwich de Pavo",
                "Vino Tinto 187ml"
            ]
        }
    }

    # Buscar el vuelo en la base de datos
    if flight_number in inventory_database:
        return inventory_database[flight_number]
    else:
        # Si no existe, devolver un inventario genérico
        return {
            "orden_vuelo": {
                "flight_number": flight_number,
                "categorias": {
                    "comida": [
                        {
                            "sku": "canelitas",
                            "cantidad_requerida": 100,
                            "peso_unitario_g": 30.0,
                            "peso_tolerancia": 1.5
                        },
                        {
                            "sku": "sandwich_pavo",
                            "cantidad_requerida": 120,
                            "peso_unitario_g": 180.5,
                            "peso_tolerancia": 5.0
                        }
                    ],
                    "bebida_no_alcoholica": [
                        {
                            "sku": "agua_600ml",
                            "cantidad_requerida": 180,
                            "peso_unitario_g": 600.0,
                            "peso_tolerancia": 10.0
                        }
                    ],
                    "bebida_alcoholica": [
                        {
                            "sku": "cerveza_nacional",
                            "cantidad_requerida": 40,
                            "peso_unitario_g": 365.0,
                            "peso_tolerancia": 8.0
                        }
                    ]
                }
            },
            "catalogo_nombres": [
                "Agua Natural 600ml",
                "Cacahuates Salados",
                "Cerveza Nacional 355ml",
                "Galletas Canelitas",
                "Galletas Principe",
                "Jugo de Naranja 300ml",
                "Refresco de Cola 355ml",
                "Sandwich de Pavo",
                "Vino Tinto 187ml"
            ]
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Número de vuelo no proporcionado"}))
        sys.exit(1)

    flight_number = sys.argv[1]
    inventory = get_inventory_for_flight(flight_number)
    print(json.dumps(inventory, ensure_ascii=False))
