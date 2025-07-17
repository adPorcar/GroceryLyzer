# Analytics API - Grocerylyzer

Módulo de análisis y estadísticas para datos de recibos y productos.

## 📊 Endpoints Disponibles

### Base URL: `http://localhost:8000/analytics/api/`

---

## 1. Tendencias de Gasto
```http
GET /spending-trend/?period=monthly
```

**Parámetros:**
- `period`: `monthly`, `weekly`, `yearly` (default: monthly)

**Respuesta:**
```json
{
  "success": true,
  "period": "monthly",
  "trends": [
    {
      "period": "2025-07-01",
      "total_spending": 125.45,
      "receipt_count": 8,
      "avg_per_receipt": 15.68
    }
  ],
  "highest_spending_period": {
    "period": "2025-07-01",
    "amount": 125.45
  },
  "total_periods": 3
}
```

---

## 2. Comparar Precios entre Supermercados
```http
GET /compare-prices/?product_name=queso
```

**Parámetros:**
- `product_name`: Nombre del producto a buscar

**Respuesta:**
```json
{
  "success": true,
  "product_name": "queso",
  "total_occurrences": 5,
  "supermarkets_found": 3,
  "cheapest_supermarket": "DIA",
  "comparisons": [
    {
      "supermarket": "DIA",
      "min_price": 1.79,
      "max_price": 1.89,
      "avg_price": 1.84,
      "occurrences": 2,
      "last_seen": "2025-07-01",
      "price_history": [...]
    }
  ]
}
```

---

## 3. Top 3 Productos por Gasto
```http
GET /top-products/
```

**Respuesta:**
```json
{
  "success": true,
  "top_products": [
    {
      "rank": 1,
      "name": "QUESO RALLADO MOZARELA",
      "total_spent": 45.67,
      "total_quantity": 12,
      "occurrences": 8,
      "avg_price": 1.85,
      "supermarkets": ["DIA", "Mercadona"],
      "last_purchase": {
        "date": "2025-07-01",
        "supermarket": "DIA",
        "price": 1.79
      }
    }
  ],
  "total_products_analyzed": 47
}
```

---

## 4. Cambios de Precio en el Tiempo
```http
GET /price-changes/?product_name=leche
```

**Parámetros:**
- `product_name`: Nombre del producto a analizar

**Respuesta:**
```json
{
  "success": true,
  "product_name": "leche",
  "price_statistics": {
    "min_price": 1.20,
    "max_price": 1.45,
    "avg_price": 1.32,
    "price_range": 0.25,
    "total_observations": 6
  },
  "biggest_increase": {
    "date": "2025-06-15",
    "price": 1.45,
    "price_change": 0.15,
    "price_change_percentage": 11.54,
    "supermarket": "Mercadona"
  },
  "biggest_decrease": {
    "date": "2025-07-01",
    "price": 1.25,
    "price_change": -0.20,
    "price_change_percentage": -13.79,
    "supermarket": "DIA"
  },
  "price_history": [...]
}
```

---

## 5. Cesta de la Compra Más Barata
```http
POST /cheapest-basket/
Content-Type: application/json

{
  "products": [
    {"name": "leche", "quantity": 2},
    {"name": "pan", "quantity": 1},
    {"name": "huevos", "quantity": 1}
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "requested_products": 3,
  "cheapest_complete_basket": {
    "supermarket": "DIA",
    "total_cost": 5.67,
    "products_found": 3,
    "products_missing": 0,
    "products_detail": [
      {
        "name": "leche",
        "unit_price": 1.25,
        "quantity": 2,
        "total_price": 2.50
      }
    ],
    "missing_products": []
  },
  "complete_baskets": [...],
  "partial_baskets": [...]
}
```

---

## 6. Ranking de Supermercados
```http
GET /supermarket-ranking/
```

**Respuesta:**
```json
{
  "success": true,
  "ranking": [
    {
      "rank": 1,
      "supermarket": "DIA",
      "score": 2.15,
      "avg_receipt_amount": 25.67,
      "total_receipts": 12,
      "total_spent": 308.04,
      "total_products_bought": 45,
      "unique_products": 23,
      "avg_product_price": 2.15,
      "last_visit": "2025-07-01",
      "top_products": ["QUESO RALLADO", "PAN TOSTADO", "LECHE"]
    }
  ],
  "cheapest_supermarket": {...},
  "most_expensive_supermarket": {...},
  "general_statistics": {
    "total_supermarkets": 4,
    "total_receipts": 28,
    "total_spent_overall": 756.23,
    "avg_receipt_overall": 27.01
  }
}
```

---

## 📈 Casos de Uso

### 1. **Dashboard de Gastos**
- Usar `/spending-trend/` para mostrar gráficos de gastos mensuales
- Usar `/top-products/` para mostrar productos más comprados

### 2. **Comparador de Precios**
- Usar `/compare-prices/` para buscar el mejor precio de un producto
- Usar `/price-changes/` para ver tendencias de precios

### 3. **Optimizador de Compras**
- Usar `/cheapest-basket/` para encontrar dónde comprar una lista de productos más barato
- Usar `/supermarket-ranking/` para elegir el supermercado más económico

### 4. **Análisis de Tendencias**
- Combinar `/spending-trend/` + `/price-changes/` para análisis completo
- Usar `/supermarket-ranking/` para decisiones estratégicas de compra

---

## 🔍 Filtros y Búsquedas

- **Búsqueda de productos**: Case-insensitive, busca coincidencias parciales
- **Períodos temporales**: Agrupa por semana/mes/año automáticamente  
- **Ranking**: Ordenado por precio promedio (menor = mejor ranking)
- **Cestas**: Compara precios más recientes de cada supermercado

## ⚠️ Consideraciones

- Los precios se basan en las compras más recientes registradas
- Los productos se buscan por coincidencia parcial del nombre
- El ranking considera precio promedio por producto, no por recibo
- La cesta más barata usa los precios más recientes disponibles
