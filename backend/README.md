# Grocerylyzer API - Backend Django

API backend para procesamiento de recibos PDF con OCR y gestión de datos de compras.

## 🚀 Características

- ✅ Procesamiento de PDFs con OCR (EasyOCR + pdfplumber)
- 🏪 Compatible con múltiples supermercados (DIA, Mercadona, Carrefour, Lidl, Aldi)
- 📊 Extracción automática de productos, precios y fechas
- 🔄 API RESTful completa
- 💾 Base de datos SQLite integrada

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

2. **Ejecutar migraciones:**
```bash
python manage.py migrate
```

3. **Crear superusuario (opcional):**
```bash
python manage.py createsuperuser
```

4. **Ejecutar servidor:**
```bash
python manage.py runserver
```

## 📡 Endpoints de la API

### Base URL: `http://localhost:8000/receipts/api/`

### 📄 Recibos

#### 1. Subir y procesar recibo
```http
POST /upload/
Content-Type: multipart/form-data

Body: 
- receipt: archivo PDF
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Recibo procesado exitosamente",
  "receipt": {
    "id": 1,
    "supermarket": "DIA",
    "date": "2025-07-01",
    "total": 25.67,
    "products_count": 5,
    "products": [
      {
        "id": 1,
        "name": "QUESO RALLADO MOZARELA",
        "quantity": 1,
        "unit_price": 1.79,
        "total_price": 1.79
      }
    ]
  }
}
```

#### 2. Listar todos los recibos
```http
GET /list/
```

**Respuesta:**
```json
{
  "success": true,
  "count": 3,
  "receipts": [...]
}
```

#### 3. Obtener detalles de un recibo
```http
GET /detail/{receipt_id}/
```

#### 4. Actualizar un recibo
```http
PUT /update/{receipt_id}/
Content-Type: application/json

{
  "supermarket_name": "Nuevo nombre",
  "date": "2025-07-01",
  "total_amount": 30.50
}
```

#### 5. Eliminar un recibo
```http
DELETE /delete/{receipt_id}/
```

### 🛒 Productos

#### 1. Listar todos los productos
```http
GET /products/
```

#### 2. Eliminar un producto
```http
DELETE /products/delete/{product_id}/
```

## 🎯 Estructura de Datos

### Modelo Receipt (Recibo)
```python
{
  "id": int,
  "supermarket_name": str,
  "date": "YYYY-MM-DD",
  "total_amount": decimal,
  "products": [Product...]
}
```

### Modelo Product (Producto)
```python
{
  "id": int,
  "name": str,
  "quantity": int/float,
  "price": decimal,  # precio unitario
  "receipt": int     # ID del recibo
}
```

## 🔍 Procesamiento OCR

El sistema utiliza una combinación de:

1. **pdfplumber**: Extracción directa de texto (más rápido)
2. **EasyOCR**: Reconocimiento óptico de caracteres (para PDFs escaneados)
3. **pdf2image**: Conversión de PDF a imagen para OCR

### Supermercados Soportados

- 🔴 **DIA**: Completamente soportado
- 🟡 **Mercadona, Carrefour, Lidl, Aldi**: Soporte básico
- ⚪ **Otros**: Detección genérica

## ⚙️ Configuración CORS

El backend está configurado para aceptar peticiones desde:
- `http://localhost:4200` (Angular dev server)

Para añadir más orígenes, editar `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://localhost:3000",  # Ejemplo: React
]
```

## 🐛 Debugging

Para ver logs detallados del procesamiento OCR:
```bash
python manage.py runserver
# Los logs aparecerán en la consola durante el procesamiento
```

## 📝 Notas Técnicas

- **Archivos temporales**: Se crean y eliminan automáticamente durante el procesamiento
- **Tamaño de archivo**: Sin límite específico, pero recomendado < 10MB
- **Formatos**: Solo archivos PDF
- **Performance**: Primera ejecución de OCR es más lenta (descarga de modelos)

## 🚦 Estados de Respuesta

- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Error en la petición (archivo inválido, etc.)
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

## 🔧 Desarrollo

Para extender el soporte a nuevos supermercados, modificar la función `parse_receipt_pdf_ocr()` en `views.py` y añadir nuevos patrones de regex en:

- `supermercado_patterns`: Para detectar el nombre del supermercado
- `total_patterns`: Para detectar el total
- `productos_section`: Para encontrar la sección de productos
- `productos_pattern1/2`: Para extraer productos individuales
