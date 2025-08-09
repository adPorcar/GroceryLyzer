# views.py - API Backend para OCR de recibos

# Parche para compatibilidad con PIL
try:
    from PIL import Image
    if not hasattr(Image, 'ANTIALIAS'):
        Image.ANTIALIAS = Image.LANCZOS
        print("✓ Parche PIL.ANTIALIAS aplicado globalmente")
except Exception as e:
    print(f"Advertencia al aplicar parche PIL global: {e}")

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import pdfplumber
import easyocr
from pdf2image import convert_from_path
import re
import json
from datetime import datetime
from pathlib import Path
import numpy as np
import tempfile
import os
from .models import Receipt, Product

def extract_with_ocr(pdf_path):
    """Extrae texto usando EasyOCR"""
    print("🔍 EXTRAYENDO CON EASYOCR...")
    
    try:
        # Inicializar EasyOCR (solo una vez)
        reader = easyocr.Reader(['es', 'en'])  # Español e inglés
        print("✓ EasyOCR inicializado")
        
        # Parchear PIL.Image.ANTIALIAS si no existe
        try:
            from PIL import Image
            if not hasattr(Image, 'ANTIALIAS'):
                Image.ANTIALIAS = Image.LANCZOS
                print("✓ Parche PIL.ANTIALIAS aplicado")
        except Exception as patch_error:
            print(f"Advertencia al aplicar parche PIL: {patch_error}")
        
        # Convertir PDF a imágenes con configuración compatible
        try:
            # Usar configuración más básica para evitar problemas de PIL
            images = convert_from_path(
                pdf_path, 
                dpi=200,  # Reducir DPI para evitar problemas
                fmt='RGB'  # Especificar formato
            )
            print(f"Convertido a {len(images)} imágenes")
        except Exception as convert_error:
            print(f"Error en conversión PDF->imagen: {convert_error}")
            # Intentar con configuración mínima
            try:
                images = convert_from_path(pdf_path, dpi=150)
                print(f"Convertido con DPI reducido: {len(images)} imágenes")
            except Exception as convert_error2:
                print(f"Error en segunda conversión: {convert_error2}")
                # Último intento con configuración muy básica
                images = convert_from_path(pdf_path)
                print(f"Convertido con configuración básica: {len(images)} imágenes")
        
        full_text = ""
        for i, image in enumerate(images):
            print(f"Procesando página {i+1}...")
            
            try:
                # Convertir PIL Image a numpy array de forma segura
                # Asegurarse de que la imagen esté en RGB
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                img_array = np.array(image)
                
                # Extraer texto con EasyOCR
                results = reader.readtext(img_array)
                
                page_text = ""
                for (bbox, text, confidence) in results:
                    if confidence > 0.5:  # Solo texto con confianza > 50%
                        page_text += text + " "
                
                full_text += page_text + "\n"
                
                print(f"Texto extraído de página {i+1}: {len(page_text)} caracteres")
                if page_text.strip():
                    print(f"Preview: {page_text[:200]}...")
                    
            except Exception as page_error:
                print(f"Error procesando página {i+1}: {page_error}")
                continue
        
        print(f"✓ OCR completado. Total de texto: {len(full_text)} caracteres")
        return full_text
        
    except Exception as e:
        print(f"Error en OCR: {e}")
        print("🔄 Intentando extracción básica de texto...")
        # Como último recurso, intentar solo pdfplumber
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    text += page_text + "\n"
                print(f"✓ Texto extraído con pdfplumber: {len(text)} caracteres")
                return text
        except Exception as fallback_error:
            print(f"Error en método de respaldo: {fallback_error}")
            return ""

def parse_receipt_pdf_ocr(pdf_path):
    """
    Extrae datos del PDF usando OCR si no hay texto directo
    """
    data = {
        "supermarket": None,
        "datetime": None,
        "total_amount": None,
        "items": [],
    }
    
    print(f"\n🔍 ANALIZANDO PDF: {pdf_path}")
    print("=" * 60)
    
    try:
        # Primero intentar extracción normal
        with pdfplumber.open(pdf_path) as pdf:
            full_text = []
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text.append(page_text)
            
            text = "\n".join(full_text)
            
            if not text.strip():
                print("❌ No hay texto extraíble - usando OCR")
                text = extract_with_ocr(pdf_path)
            else:
                print("✓ Texto extraído directamente del PDF")
        
        if not text.strip():
            print("❌ No se pudo extraer texto ni con OCR")
            # Devolver datos básicos en lugar de None
            return {
                "supermarket": "Desconocido",
                "datetime": datetime.now(),
                "total_amount": 0.0,
                "items": [],
            }
        
        print("\n" + "=" * 50)
        print("TEXTO FINAL EXTRAÍDO:")
        print("=" * 50)
        print(text[:2000] + "..." if len(text) > 2000 else text)
        print("=" * 50)
        
        # Procesar el texto extraído
        lines = text.splitlines()
        
        # 1) Buscar supermercado (extraer solo el nombre de la tienda)
        supermercado_patterns = [
            r'DIA',
            r'MERCADONA',
            r'CARREFOUR',
            r'LIDL',
            r'ALDI',
            r'Compra en (.+?) \d{2}/\d{2}/\d{4}',
        ]
        
        for pattern in supermercado_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if match.groups():
                    data["supermarket"] = match.group(1).strip()
                else:
                    data["supermarket"] = match.group(0).strip()
                print(f"✓ Supermercado: {data['supermarket']}")
                break
        
        # Si no se encontró con patrones, usar la primera línea significativa
        if not data["supermarket"]:
            for line in lines[:5]:
                line = line.strip()
                if line and len(line) > 3 and not re.match(r'^\d', line):
                    data["supermarket"] = line[:50]  # Limitar longitud
                    print(f"✓ Supermercado (fallback): {data['supermarket']}")
                    break
        
        # 2) Buscar fecha/hora
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{4}[\s]+\d{1,2}:\d{2})',
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    date_str = match.group(1)
                    # Intentar diferentes formatos
                    formats = [
                        "%d/%m/%Y %H:%M",
                        "%d-%m-%Y %H:%M",
                        "%d/%m/%Y",
                        "%d-%m-%Y",
                        "%Y/%m/%d",
                        "%Y-%m-%d"
                    ]
                    for fmt in formats:
                        try:
                            data["datetime"] = datetime.strptime(date_str, fmt)
                            print(f"✓ Fecha: {data['datetime']}")
                            break
                        except ValueError:
                            continue
                    if data["datetime"]:
                        break
                except Exception as e:
                    print(f"Error al parsear fecha: {e}")
        
        # 3) Buscar total (mejorado)
        total_patterns = [
            r'Total a pagar[._\s]*(\d+[,\.]\d{2})',
            r'Total venta [A-Za-z]*\s+(\d+[,\.]\d{2})',
            r'IMPORTE:\s*(\d+[,\.]\d{2})',
            r'Total[:\s]*(\d+[,\.]\d{2})',
            r'TOTAL[:\s]*(\d+[,\.]\d{2})',
        ]
        
        for pattern in total_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                try:
                    # Tomar el último (probablemente el total final)
                    total_str = matches[-1].replace(',', '.')
                    data["total_amount"] = float(total_str)
                    print(f"✓ Total: {data['total_amount']}€")
                    break
                except ValueError:
                    continue
        
        # 4) Buscar productos (usando tu lógica completa)
        print("\n--- BUSCANDO PRODUCTOS ---")
        
        # Buscar la sección de productos entre marcadores específicos
        productos_section = None
        
        # Para DIA: entre "Productos vendidos por Dia" y "Total venta Dia"
        match = re.search(
            r'Productos vendidos por Dia[^A-Z]*?DESCRIPCIÓN.*?Total venta Dia',
            text,
            re.S | re.IGNORECASE
        )
        if match:
            productos_section = match.group(0)
            print("✓ Sección de productos DIA encontrada")
        
        if productos_section:
            # Usar un método más directo: buscar todos los productos usando regex
            # Patrón que captura: NOMBRE cantidad ud/kg precio € precio € 
            
            # Primero, intentar patrón con cantidad explícita
            productos_pattern1 = r'([A-Z][A-Z\s]+?)\s+(\d+[,\.]?\d*)\s+(ud|kg)\s+(\d+[,\.]\d{2})\s*€\s+(\d+[,\.]\d{2})\s*€'
            productos_matches1 = re.findall(productos_pattern1, productos_section)
            print(f"Productos con cantidad explícita: {len(productos_matches1)}")
            
            # Segundo, intentar patrón con cantidad implícita (ud = 1)
            productos_pattern2 = r'([A-Z][A-Z\s]+?)\s+ud\s+(\d+[,\.]\d{2})\s*€\s+(\d+[,\.]\d{2})\s*€'
            productos_matches2 = re.findall(productos_pattern2, productos_section)
            print(f"Productos con cantidad implícita (ud): {len(productos_matches2)}")
            
            # Procesar productos con cantidad explícita
            for match in productos_matches1:
                try:
                    nombre = match[0].strip()
                    cantidad_str = match[1].replace(',', '.')
                    unidad = match[2]
                    precio_unitario = float(match[3].replace(',', '.'))
                    precio_total = float(match[4].replace(',', '.'))
                    
                    # Para ud, la cantidad debe ser entero
                    if unidad == 'ud':
                        cantidad = int(float(cantidad_str))
                    else:  # kg
                        cantidad = float(cantidad_str)
                    
                    # Limpiar nombre - remover letra inicial A/B
                    nombre = re.sub(r'^[AB]\s+', '', nombre)
                    nombre = re.sub(r'\s+', ' ', nombre).strip()
                    
                    if len(nombre) > 2:
                        item = {
                            "name": nombre,
                            "quantity": cantidad,
                            "unit_price": precio_unitario,
                            "total_price": precio_total,
                        }
                        
                        data["items"].append(item)
                        print(f"  ✓ Producto: {item}")
                
                except Exception as e:
                    print(f"  ✗ Error procesando producto {match}: {e}")
            
            # Procesar productos con cantidad implícita (ud = 1)
            for match in productos_matches2:
                try:
                    nombre = match[0].strip()
                    precio_unitario = float(match[1].replace(',', '.'))
                    precio_total = float(match[2].replace(',', '.'))
                    
                    # Cantidad implícita = 1 para ud
                    cantidad = 1
                    
                    # Limpiar nombre
                    nombre = re.sub(r'^.*?TOTAL\s+', '', nombre)
                    nombre = re.sub(r'^.*?PRECIO\s+KG\s+', '', nombre)
                    nombre = re.sub(r'^.*?CANTIDAD\s+', '', nombre)
                    nombre = re.sub(r'^[A-Z]\s+', '', nombre)  # Remover letra inicial A/B
                    nombre = re.sub(r'\s+', ' ', nombre).strip()
                    
                    # Verificar que no sea duplicado
                    ya_existe = any(item['name'] == nombre for item in data["items"])
                    
                    if len(nombre) > 2 and not ya_existe and not any(x in nombre for x in ['DESCRIPCIÓN', 'CANTIDAD', 'PRECIO', 'TOTAL']):
                        item = {
                            "name": nombre,
                            "quantity": cantidad,
                            "unit_price": precio_unitario,
                            "total_price": precio_total,
                        }
                        
                        data["items"].append(item)
                        print(f"  ✓ Producto (ud=1): {item}")
                
                except Exception as e:
                    print(f"  ✗ Error procesando producto {match}: {e}")
        
    except Exception as e:
        print(f"❌ Error general: {e}")
        # Devolver datos básicos en lugar de None
        return {
            "supermarket": "Desconocido",
            "datetime": datetime.now(),
            "total_amount": 0.0,
            "items": [],
        }
    
    print(f"✅ Datos finales procesados: {data}")
    return data

@csrf_exempt
@require_http_methods(["POST"])
def receipt_upload_view(request):
    """API endpoint para subir y procesar recibos PDF con OCR"""
    print("🔥 NUEVA PETICIÓN DE UPLOAD")
    print(f"Files en request: {list(request.FILES.keys())}")
    
    if 'receipt' not in request.FILES:
        print("❌ No se encontró archivo 'receipt' en request.FILES")
        return JsonResponse({'error': 'No se ha subido ningún archivo'}, status=400)
    
    pdf_file = request.FILES["receipt"]
    print(f"✓ Archivo recibido: {pdf_file.name} ({pdf_file.size} bytes)")
    
    # Validar que es un PDF
    if not pdf_file.name.endswith('.pdf'):
        print(f"❌ Archivo no es PDF: {pdf_file.name}")
        return JsonResponse({'error': 'Solo se permiten archivos PDF'}, status=400)
    
    try:
        print("💾 Guardando archivo temporal...")
        # Guardar temporalmente el archivo
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            for chunk in pdf_file.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name
        
        print(f"✓ Archivo guardado en: {temp_path}")
        
        # Procesar el PDF con OCR
        print("🔍 Iniciando procesamiento con OCR...")
        parsed = parse_receipt_pdf_ocr(temp_path)
        print(f"✓ Procesamiento completado. Resultado: {parsed}")
        
        # Limpiar archivo temporal
        os.unlink(temp_path)
        print("✓ Archivo temporal eliminado")
        
        if not parsed:
            print("❌ No se pudo procesar el PDF - parsed is None/False")
            return JsonResponse({'error': 'No se pudo procesar el PDF'}, status=400)
        
        print("💾 Guardando en base de datos...")
        # Guardar en base de datos
        receipt = Receipt.objects.create(
            supermarket_name=parsed["supermarket"] or "Desconocido",
            date=parsed["datetime"].date() if parsed["datetime"] else datetime.now().date(),
            total_amount=parsed["total_amount"] or 0.0,
        )
        
        # Guardar productos
        products_created = []
        for item in parsed["items"]:
            product = Product.objects.create(
                name=item["name"],
                price=item["unit_price"],  
                quantity=item["quantity"],
                receipt=receipt
            )
            products_created.append({
                'id': product.id,
                'name': product.name,
                'quantity': product.quantity,
                'unit_price': float(product.price),
                'total_price': float(product.quantity) * float(product.price)
            })
        
        # Respuesta exitosa
        response_data = {
            'success': True,
            'message': 'Recibo procesado exitosamente',
            'receipt': {
                'id': receipt.id,
                'supermarket': receipt.supermarket_name,
                'date': receipt.date.strftime('%Y-%m-%d'),
                'total': float(receipt.total_amount),
                'products_count': len(products_created),
                'products': products_created
            }
        }
        
        return JsonResponse(response_data, status=201)
    
    except Exception as e:
        print(f"Error procesando recibo: {e}")
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def receipt_list_view(request):
    """API endpoint para listar todos los recibos (optimizado)"""
    import time
    start_time = time.time()
    
    # Optimización: usar annotations para contar productos en una sola query
    from django.db.models import Count
    receipts = Receipt.objects.annotate(
        products_count=Count('products')
    ).all().order_by('-date')
    
    receipts_data = []
    for receipt in receipts:
        receipts_data.append({
            'id': receipt.id,
            'supermarket': receipt.supermarket_name,
            'date': receipt.date.strftime('%Y-%m-%d'),
            'total': float(receipt.total_amount),
            'products_count': receipt.products_count,  # Usa el annotated count
            # No incluimos la lista completa de productos aquí para optimizar
        })
    
    duration = time.time() - start_time
    print(f"📋 receipt_list_view completado en {duration:.3f} segundos")
    print(f"📋 Devolviendo {len(receipts_data)} recibos")
    
    # Debug: Mostrar los primeros recibos
    if receipts_data:
        print(f"📋 Primer recibo: {receipts_data[0]}")
    else:
        print("📋 No hay recibos en la base de datos")
    
    response_data = {
        'success': True,
        'total_count': len(receipts_data),
        'receipts': receipts_data
    }
    
    print(f"📋 Response final: {response_data}")
    
    return JsonResponse(response_data)

@csrf_exempt
@require_http_methods(["GET"])
def receipt_detail_view(request, receipt_id):
    """API endpoint para ver detalles de un recibo específico (optimizado)"""
    import time
    start_time = time.time()
    
    try:
        # Optimización: usar prefetch_related para productos
        receipt = Receipt.objects.prefetch_related('products').get(id=receipt_id)
        products = receipt.products.all()
        
        receipt_data = {
            'id': receipt.id,
            'supermarket': receipt.supermarket_name,
            'date': receipt.date.strftime('%Y-%m-%d'),
            'total': float(receipt.total_amount),
            'products_count': len(products),  # Usar len() en lugar de count() ya que están prefetched
            'products': [
                {
                    'id': product.id,
                    'name': product.name,
                    'quantity': product.quantity,
                    'unit_price': float(product.price),
                    'total_price': float(product.quantity) * float(product.price)
                }
                for product in products
            ]
        }
        
        duration = time.time() - start_time
        print(f"👁️ receipt_detail_view completado en {duration:.3f} segundos")
        
        return JsonResponse({
            'success': True,
            'receipt': receipt_data
        })
        
    except Receipt.DoesNotExist:
        return JsonResponse({'error': 'Recibo no encontrado'}, status=404)

@csrf_exempt
@require_http_methods(["DELETE"])
def receipt_delete_view(request, receipt_id):
    """API endpoint para eliminar un recibo específico con todos sus productos asociados"""
    try:
        receipt = Receipt.objects.get(id=receipt_id)
        
        # Obtener información de los productos antes de eliminar
        products = receipt.products.all()
        products_count = products.count()
        products_info = [
            {
                'id': product.id,
                'name': product.name,
                'quantity': product.quantity,
                'unit_price': float(product.price)
            }
            for product in products
        ]
        
        # Información del recibo antes de eliminar
        receipt_info = {
            'id': receipt.id,
            'supermarket': receipt.supermarket_name,
            'date': receipt.date.strftime('%Y-%m-%d'),
            'total': float(receipt.total_amount),
            'products_count': products_count
        }
        
        # Eliminar el recibo (esto eliminará automáticamente todos los productos asociados debido a CASCADE)
        receipt.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Recibo {receipt_id} eliminado exitosamente junto con {products_count} productos',
            'deleted_receipt': receipt_info,
            'deleted_products': products_info
        })
        
    except Receipt.DoesNotExist:
        return JsonResponse({'error': 'Recibo no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@csrf_exempt  
@require_http_methods(["PUT", "PATCH"])
def receipt_update_view(request, receipt_id):
    """API endpoint para actualizar un recibo específico"""
    try:
        receipt = Receipt.objects.get(id=receipt_id)
        
        # Parsear JSON del body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        
        # Actualizar campos del recibo
        if 'supermarket_name' in data:
            receipt.supermarket_name = data['supermarket_name']
        if 'date' in data:
            try:
                receipt.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Formato de fecha inválido (usar YYYY-MM-DD)'}, status=400)
        if 'total_amount' in data:
            receipt.total_amount = data['total_amount']
        
        receipt.save()
        
        # Respuesta con el recibo actualizado
        products = receipt.products.all()
        receipt_data = {
            'id': receipt.id,
            'supermarket': receipt.supermarket_name,
            'date': receipt.date.strftime('%Y-%m-%d'),
            'total': float(receipt.total_amount),
            'products_count': products.count(),
            'products': [
                {
                    'id': product.id,
                    'name': product.name,
                    'quantity': product.quantity,
                    'unit_price': float(product.price),
                    'total_price': float(product.quantity) * float(product.price)
                }
                for product in products
            ]
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Recibo actualizado exitosamente',
            'receipt': receipt_data
        })
        
    except Receipt.DoesNotExist:
        return JsonResponse({'error': 'Recibo no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@require_http_methods(["GET"])
def products_list_view(request):
    """API endpoint para listar todos los productos"""
    products = Product.objects.all().select_related('receipt').order_by('-receipt__date')
    
    products_data = []
    for product in products:
        products_data.append({
            'id': product.id,
            'name': product.name,
            'quantity': product.quantity,
            'unit_price': float(product.price),
            'total_price': float(product.quantity) * float(product.price),
            'receipt': {
                'id': product.receipt.id,
                'supermarket': product.receipt.supermarket_name,
                'date': product.receipt.date.strftime('%Y-%m-%d'),
            }
        })
    
    return JsonResponse({
        'success': True,
        'count': len(products_data),
        'products': products_data
    })

@csrf_exempt
@require_http_methods(["DELETE"])
def product_delete_view(request, product_id):
    """API endpoint para eliminar un producto específico"""
    try:
        product = Product.objects.get(id=product_id)
        receipt_id = product.receipt.id
        product.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Producto {product_id} eliminado exitosamente',
            'receipt_id': receipt_id
        })
        
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Producto no encontrado'}, status=404)
