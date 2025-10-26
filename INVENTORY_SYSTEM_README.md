# Sistema de Inventario - SmartStation

Sistema de validación de inventario para vuelos dentro de SmartStation, con integración opcional de IA (Gemini) para análisis visual de productos.

## Estructura del Proyecto

```
gategroup-1/
├── backend/
│   ├── server.js                    # Servidor Express
│   ├── package.json                 # Dependencias del backend
│   └── scripts/
│       ├── get_inventory.py         # Script Python para obtener inventario
│       └── validate_inventory.py    # Script Python para validar inventario
└── gategroup/
    └── src/
        └── pages/
            └── Inventory.jsx        # Componente React del frontend
```

## Instalación

### Backend

1. Navegar a la carpeta del backend:

```powershell
cd backend
```

2. Instalar dependencias de Node.js:

```powershell
npm install
```

3. Verificar que Python 3 esté instalado:

```powershell
python3 --version
```

4. (Windows) No es necesario usar chmod; simplemente asegúrate de que Python puede ejecutar los scripts. En Unix/macOS, usa:

```bash
chmod +x scripts/get_inventory.py
chmod +x scripts/validate_inventory.py
```

### Frontend

1. Navegar a la carpeta del frontend:

```bash
cd gategroup
```

2. Las dependencias ya deberían estar instaladas, pero si no:

```bash
npm install
```

## Iniciar el Sistema

### 1. Iniciar el Backend

Desde la carpeta `backend`:

```powershell
npm start
```

El servidor estará corriendo en http://localhost:3001

Para desarrollo con auto-reload:

```powershell
npm run dev
```

### 2. Iniciar el Frontend

Desde la carpeta `gategroup`:

```powershell
npm run dev
```

El frontend estará corriendo en http://localhost:5173 (o el puerto que indique Vite)

## Flujo de Uso

### 1. Pantalla de Ingreso de Vuelo

- El usuario ingresa el número de vuelo (ej: AM241, BA456)
- Al presionar "Obtener Inventario", el sistema consulta el backend
- El backend ejecuta el script Python que devuelve el inventario esperado

### 2. Pantalla de Selección de Categoría

- Se muestran 3 categorías:
  - Comidas
  - Bebidas No Alcohólicas
  - Bebidas Alcohólicas
- El usuario selecciona una categoría para validar
- Las categorías ya completadas se marcan con un check verde

### 3. Pantalla de Escaneo

- Se muestran los productos esperados para la categoría seleccionada
- El usuario toma fotos de los productos sobre una báscula
- Cada foto se procesa con Gemini AI para extraer:
  - Categoría escaneada
  - Peso total medido (leyendo la báscula)
  - Tipos de productos detectados
- El usuario puede tomar múltiples fotos
- Al presionar "Enviar para Validación", los datos se envían al backend

### 4. Validación en Backend

El backend compara los datos escaneados contra el inventario esperado:

- Verifica el peso total (con tolerancias)
- Verifica que todos los productos esperados estén presentes
- Detecta productos faltantes o extra

**Si la validación es exitosa:**

- La categoría se marca como completada
- El sistema vuelve a la selección de categorías

**Si hay errores:**

- Se muestran los errores específicos
- El usuario puede volver a tomar fotos

### 5. Pantalla Final

- Cuando todas las categorías están validadas
- Se muestra un mensaje de "Inventario de vuelo completo"
- El usuario puede procesar un nuevo vuelo

## Endpoints del Backend

### POST /api/inventory/flight

Obtiene el inventario esperado para un vuelo.

**Request:**

```json
{
  "flight_number": "AM241"
}
```

**Response:**

```json
{
  "orden_vuelo": {
    "flight_number": "AM241",
    "categorias": {
      "comida": [
        {
          "sku": "canelitas",
          "cantidad_requerida": 100,
          "peso_unitario_g": 30.0,
          "peso_tolerancia": 1.5
        }
      ],
      "bebida_no_alcoholica": [...],
      "bebida_alcoholica": [...]
    }
  },
  "catalogo_nombres": [
    "Agua Natural 600ml",
    "Galletas Canelitas",
    ...
  ]
}
```

### POST /api/inventory/validate

Valida el inventario escaneado contra el inventario esperado.

**Request:**

```json
{
  "flight_number": "AM241",
  "scanned_data": [
    {
      "timestamp": "2025-10-25T15:30:00Z",
      "categoria_escaneada": "comida",
      "peso_total_medido_g": 5970,
      "tipos_detectados_vision": ["canelitas", "principe"]
    }
  ]
}
```

**Response:**

```json
{
  "flight_number": "AM241",
  "validation_status": "success" | "failed",
  "categories_validated": [
    {
      "categoria": "comida",
      "status": "valid" | "invalid",
      "peso": {
        "medido_g": 5970,
        "esperado_g": 6000,
        "status": "ok" | "underweight" | "overweight",
        "message": "..."
      },
      "productos": {
        "detectados": ["canelitas", "principe"],
        "esperados": ["canelitas", "principe", "sandwich_pavo"],
        "faltantes": ["sandwich_pavo"],
        "extra": [],
        "messages": [...]
      }
    }
  ],
  "errors": [...],
  "overall_message": "..."
}
```

### GET /api/health

Health check del servidor.

## Formato JSON de Gemini

Cuando el usuario toma una foto, Gemini AI analiza la imagen y devuelve un JSON similar a:

```json
{
  "categoria_escaneada": "comida",
  "peso_total_medido_g": 5970,
  "tipos_detectados_vision": ["canelitas", "principe"]
}
```

## Agregar Nuevos Vuelos

Para agregar nuevos vuelos al sistema, edita el archivo `backend/scripts/get_inventory.py`:

```python
inventory_database = {
    "NUEVO_VUELO": {
        "orden_vuelo": {
            "flight_number": "NUEVO_VUELO",
            "categorias": {
                "comida": [
                    {
                        "sku": "nombre_producto",
                        "cantidad_requerida": 100,
                        "peso_unitario_g": 50.0,
                        "peso_tolerancia": 2.0
                    }
                ],
                ...
            }
        },
        "catalogo_nombres": [...]
    }
}
```

## Manejo de Estado en Frontend

El componente `Inventory.jsx` maneja el estado con React hooks:

```javascript
const [step, setStep] = useState("flight_input");
// Pasos: 'flight_input', 'category_selection', 'scanning', 'complete'

const [flightNumber, setFlightNumber] = useState("");
const [inventoryData, setInventoryData] = useState(null);
const [selectedCategory, setSelectedCategory] = useState(null);
const [scannedPhotos, setScannedPhotos] = useState([]);
const [completedCategories, setCompletedCategories] = useState([]);
const [validationResult, setValidationResult] = useState(null);
```

## Configuración de API Keys

La integración con Gemini requiere una API key. Actualmente el proyecto incluye una key placeholder en `Inventory.jsx`.

IMPORTANTE: No pongas claves en el código fuente. Mueve cualquier API key a variables de entorno y a un vault antes de desplegar.

Ejemplo (frontend): usa una ruta del backend que inyecte el token de forma segura o solicite la clave desde un servicio seguro.

## Troubleshooting

### Error: Cannot find module 'express'

```powershell
cd backend; npm install
```

### Error: Python script not found

Verifica que los scripts estén en `backend/scripts/`.

### Error: CORS

El backend ya tiene CORS configurado. Si sigues teniendo problemas, verifica que el frontend esté apuntando a http://localhost:3001 y que las solicitudes incluyan `credentials: 'include'` si usas cookies.

### Error: Gemini API

Verifica que la API key sea válida y que tengas conexión a internet. No expongas la clave en el frontend para producción.

## Próximas Mejoras

- Guardar resultados de validación en base de datos
- Exportar reportes en PDF
- Dashboard de estadísticas
- Autenticación de usuarios
- Modo offline con sincronización posterior
- Soporte para múltiples idiomas

## Tecnologías Utilizadas

- **Frontend:** React, Vite, TailwindCSS, React Router
- **Backend:** Node.js, Express
- **IA:** Google Gemini 2.5 Flash
- **Scripting:** Python 3
- **Análisis:** Computer Vision para lectura de báscula y detección de productos

## Contacto y Soporte

Para reportar bugs o sugerir mejoras, contacta al equipo de desarrollo.

---

**Última actualización:** 25 de Octubre, 2025
