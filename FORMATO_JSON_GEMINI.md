# 📋 Formato JSON Exacto para Validación de Inventario

## 🎯 Resumen
Este documento explica el formato JSON EXACTO que Gemini debe devolver al procesar fotos de inventario para que la validación funcione correctamente.

---

## 📸 Cuando Gemini Procesa una Foto

### Input: Foto de productos en una báscula

### Output Requerido (SIEMPRE este formato):

```json
{
  "peso_medido_g": 2942,
  "tipos_detectados_vision": [
    "canelitas_35g",
    "principe_49g"
  ]
}
```

### ⚠️ REGLAS CRÍTICAS:

1. **`peso_medido_g`**: Número entero (sin comillas) del peso EXACTO que muestra la báscula
   - ✅ Correcto: `2942`
   - ❌ Incorrecto: `"2942"`, `2942.0`, `"2.9kg"`

2. **`tipos_detectados_vision`**: Array de strings con SKUs COMPLETOS del catálogo
   - ✅ Correcto: `["canelitas_35g", "principe_49g"]`
   - ❌ Incorrecto: `["canelitas", "principe"]`
   - ❌ Incorrecto: `["Canelitas 35g", "Príncipe 49g"]`

---

## 📦 Ejemplo Completo del Flujo

### 1. Frontend solicita inventario del vuelo

**Request:**
```
GET /api/inventory/flight
Body: { "flight_number": "IB789" }
```

**Response del Backend:**
```json
{
  "flight_number": "IB789",
  "total_carritos_en_vuelo": 3,
  "carritos": [
    {
      "cart_id": 30,
      "cart_identifier": "CARRITO-30-IB789",
      "items_requeridos": [
        {
          "sku": "jugo_valle_naranja_1l",
          "cantidad_requerida": 1,
          "peso_unitario_g": 1028,
          "peso_tolerancia": 15
        },
        {
          "sku": "electrolit_fresa_kiwi",
          "cantidad_requerida": 4,
          "peso_unitario_g": 402,
          "peso_tolerancia": 10
        },
        {
          "sku": "agua_mineral_ciel_363g",
          "cantidad_requerida": 4,
          "peso_unitario_g": 363,
          "peso_tolerancia": 10
        },
        {
          "sku": "principe_49g",
          "cantidad_requerida": 24,
          "peso_unitario_g": 49,
          "peso_tolerancia": 2
        },
        {
          "sku": "canelitas_35g",
          "cantidad_requerida": 20,
          "peso_unitario_g": 35,
          "peso_tolerancia": 2
        }
      ]
    }
  ],
  "catalogo_nombres": [
    "agua_mineral_ciel_363g",
    "canelitas_35g",
    "cerveza_corona_355ml",
    "electrolit_fresa_kiwi",
    "jugo_valle_naranja_1l",
    "principe_49g",
    "refresco_coca_cola_355ml"
  ]
}
```

### 2. Usuario toma foto y Gemini la procesa

**Input de Gemini:** Foto de productos en báscula

**Output de Gemini (LO QUE DEBE REGRESAR SIEMPRE):**
```json
{
  "peso_medido_g": 2942,
  "tipos_detectados_vision": [
    "canelitas_35g",
    "principe_49g"
  ]
}
```

### 3. Usuario toma más fotos (si es necesario)

**Segunda foto:**
```json
{
  "peso_medido_g": 4766,
  "tipos_detectados_vision": [
    "jugo_valle_naranja_1l",
    "electrolit_fresa_kiwi"
  ]
}
```

### 4. Frontend envía todas las fotos al backend para validación

**Request:**
```
POST /api/inventory/validate
Body:
{
  "flight_number": "IB789",
  "scanned_data": [
    {
      "cart_id": 30,
      "cajas_escaneadas": [
        {
          "peso_medido_g": 2942,
          "tipos_detectados_vision": ["canelitas_35g", "principe_49g"]
        },
        {
          "peso_medido_g": 4766,
          "tipos_detectados_vision": ["jugo_valle_naranja_1l", "electrolit_fresa_kiwi"]
        }
      ]
    }
  ]
}
```

### 5. Backend valida y responde

**Response del Backend:**
```json
{
  "analysis_timestamp": "2025-10-26T01:49:16.095393",
  "flight_number": "IB789",
  "peso_tara_asumido_por_caja_g": 721,
  "reporte_carritos": [
    {
      "cart_id": 30,
      "numero_cajas_escaneadas": 2,
      "peso_bruto_medido_g": 7708,
      "peso_tara_estimado_g": 1442,
      "peso_neto_medido_g": 6266,
      "status": "OK",
      "reporte": [
        "Carrito validado correctamente. Peso neto: 6266.00g (Esperado: 5964.0g)"
      ]
    }
  ]
}
```

---

## 🔍 Estados de Validación

### ✅ Status: "OK"
```json
{
  "status": "OK",
  "reporte": [
    "Carrito validado correctamente. Peso neto: 6266.00g (Esperado: 5964.0g)"
  ]
}
```

### ⚠️ Status: "WARNING_VISUAL"
```json
{
  "status": "WARNING_VISUAL",
  "reporte": [
    "Productos FALTANTES (no vistos): ['agua_mineral_ciel_363g']"
  ]
}
```

### ❌ Status: "ERROR_VISUAL"
```json
{
  "status": "ERROR_VISUAL",
  "reporte": [
    "Productos INCORRECTOS detectados: ['cerveza_corona_355ml']",
    "Productos FALTANTES (no vistos): ['agua_mineral_ciel_363g']"
  ]
}
```

### ❌ Status: "ERROR_PESO"
```json
{
  "status": "ERROR_PESO",
  "reporte": [
    "Discrepancia de peso (neto): Faltan 3743.0g. (Esperado: 5964.0g [Rango: 5925.00g a 6003.00g], Medido Neto: 2221.00g)",
    "Sugerencia: Faltan 3 agua_mineral_ciel_363g, Faltan 1 electrolit_fresa_kiwi."
  ]
}
```

---

## 🛠️ Validaciones que se Hacen

1. **Validación de SKUs**: Todos los SKUs detectados DEBEN estar en el catálogo
2. **Validación de Productos**: Compara productos detectados vs esperados
3. **Validación de Peso**:
   - Peso bruto (con cajas)
   - Peso tara (721g por caja)
   - Peso neto (bruto - tara)
   - Rango permitido (esperado ± tolerancia)

---

## 📝 Ejemplos de SKUs Válidos

| Producto | SKU Correcto | ❌ SKUs Incorrectos |
|----------|-------------|-------------------|
| Galletas Canelitas | `canelitas_35g` | `canelitas`, `Canelitas`, `canelitas 35g` |
| Galletas Príncipe | `principe_49g` | `principe`, `Príncipe`, `principe 49g` |
| Agua Ciel | `agua_mineral_ciel_363g` | `agua`, `ciel`, `agua_ciel` |
| Jugo Valle | `jugo_valle_naranja_1l` | `jugo`, `valle`, `jugo_naranja` |
| Electrolit | `electrolit_fresa_kiwi` | `electrolit`, `bebida_deportiva` |

---

## 🚀 Mejoras Implementadas

### 1. Schema Estricto con Enum
```javascript
const schema = {
  type: "OBJECT",
  properties: {
    tipos_detectados_vision: {
      type: "ARRAY",
      items: {
        type: "STRING",
        enum: catalogoCompleto  // Solo permite SKUs del catálogo
      }
    }
  }
};
```

### 2. Validación Post-Procesamiento
```javascript
// Validar que todos los SKUs estén en el catálogo
const skusInvalidos = parsedResponse.tipos_detectados_vision.filter(
  sku => !catalogoCompleto.includes(sku)
);

// Intentar corregir SKUs similares
if (skusInvalidos.length > 0) {
  parsedResponse.tipos_detectados_vision = parsedResponse.tipos_detectados_vision.map(sku => {
    if (!catalogoCompleto.includes(sku)) {
      const skuSimilar = catalogoCompleto.find(catalogoSku =>
        catalogoSku.toLowerCase().includes(sku.toLowerCase())
      );
      return skuSimilar || sku;
    }
    return sku;
  }).filter(sku => catalogoCompleto.includes(sku));
}
```

### 3. Prompt Mejorado y Específico
- Lista completa de SKUs válidos
- Ejemplos específicos de formato correcto
- Reglas numeradas y claras
- Comparación visual con emojis
- Temperatura baja (0.1) para consistencia

---

## ✅ Checklist de Validación

Antes de enviar fotos al backend, el sistema verifica:

- [ ] Gemini devolvió `peso_medido_g` como número
- [ ] Gemini devolvió `tipos_detectados_vision` como array
- [ ] Todos los SKUs están en el catálogo
- [ ] Si hay SKUs inválidos, se intentan corregir automáticamente
- [ ] Los datos se formatean correctamente para el backend

---

## 🎓 Conclusión

**FORMATO OBLIGATORIO de respuesta de Gemini:**
```json
{
  "peso_medido_g": <número_entero>,
  "tipos_detectados_vision": ["sku_completo_1", "sku_completo_2"]
}
```

**Donde:**
- `peso_medido_g` = número exacto de la báscula
- `tipos_detectados_vision` = array de SKUs COMPLETOS del catálogo (con sufijos de peso)

Este formato es CRÍTICO para que la validación funcione correctamente.
