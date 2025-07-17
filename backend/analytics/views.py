from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Avg, Count, Max, Min
from django.db.models.functions import TruncMonth, TruncWeek, TruncYear
from datetime import datetime, timedelta
from receipts.models import Receipt, Product
from collections import defaultdict
import json

@require_http_methods(["GET"])
def get_spending_trend(request):
    """API endpoint para obtener tendencias de gasto por período"""
    period = request.GET.get('period', 'monthly')  # monthly, weekly, yearly
    
    try:
        if period == 'monthly':
            # Agrupar por mes
            trends = Receipt.objects.annotate(
                period=TruncMonth('date')
            ).values('period').annotate(
                total_spending=Sum('total_amount'),
                receipt_count=Count('id')
            ).order_by('period')
            
        elif period == 'weekly':
            # Agrupar por semana
            trends = Receipt.objects.annotate(
                period=TruncWeek('date')
            ).values('period').annotate(
                total_spending=Sum('total_amount'),
                receipt_count=Count('id')
            ).order_by('period')
            
        elif period == 'yearly':
            # Agrupar por año
            trends = Receipt.objects.annotate(
                period=TruncYear('date')
            ).values('period').annotate(
                total_spending=Sum('total_amount'),
                receipt_count=Count('id')
            ).order_by('period')
        else:
            return JsonResponse({'error': 'Período inválido. Use: monthly, weekly, yearly'}, status=400)
        
        # Encontrar el período con mayor gasto
        max_spending_period = max(trends, key=lambda x: x['total_spending']) if trends else None
        
        trends_data = []
        for trend in trends:
            trends_data.append({
                'period': trend['period'].strftime('%Y-%m-%d'),
                'total_spending': float(trend['total_spending']),
                'receipt_count': trend['receipt_count'],
                'avg_per_receipt': float(trend['total_spending'] / trend['receipt_count']) if trend['receipt_count'] > 0 else 0
            })
        
        return JsonResponse({
            'success': True,
            'period': period,
            'trends': trends_data,
            'highest_spending_period': {
                'period': max_spending_period['period'].strftime('%Y-%m-%d'),
                'amount': float(max_spending_period['total_spending'])
            } if max_spending_period else None,
            'total_periods': len(trends_data)
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
@require_http_methods(["GET"])
def compare_supermarket_prices(request):
    """API endpoint para comparar precios de un producto entre supermercados"""
    product_name = request.GET.get('product_name')
    
    if not product_name:
        return JsonResponse({'error': 'Parámetro product_name es requerido'}, status=400)
    
    try:
        # Buscar productos que contengan el nombre (case insensitive)
        products = Product.objects.filter(
            name__icontains=product_name
        ).select_related('receipt')
        
        if not products:
            return JsonResponse({
                'success': True,
                'product_name': product_name,
                'message': 'No se encontraron productos con ese nombre',
                'comparisons': []
            })
        
        # Agrupar por supermercado
        supermarket_data = defaultdict(list)
        for product in products:
            supermarket_data[product.receipt.supermarket_name].append({
                'price': float(product.price),
                'date': product.receipt.date.strftime('%Y-%m-%d'),
                'receipt_id': product.receipt.id,
                'quantity': product.quantity
            })
        
        # Calcular estadísticas por supermercado
        comparisons = []
        for supermarket, prices_data in supermarket_data.items():
            prices = [item['price'] for item in prices_data]
            
            comparisons.append({
                'supermarket': supermarket,
                'min_price': min(prices),
                'max_price': max(prices),
                'avg_price': sum(prices) / len(prices),
                'occurrences': len(prices),
                'last_seen': max(prices_data, key=lambda x: x['date'])['date'],
                'price_history': prices_data
            })
        
        # Ordenar por precio promedio
        comparisons.sort(key=lambda x: x['avg_price'])
        
        return JsonResponse({
            'success': True,
            'product_name': product_name,
            'total_occurrences': len(products),
            'supermarkets_found': len(comparisons),
            'cheapest_supermarket': comparisons[0]['supermarket'] if comparisons else None,
            'comparisons': comparisons
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
@require_http_methods(["GET"])
def get_top_three_products(request):
    """API endpoint para obtener los top 3 productos por gasto total"""
    
    try:
        # Agrupar productos por nombre y calcular gasto total
        products_spending = Product.objects.values('name').annotate(
            total_spent=Sum('price'),  # Suma de todos los precios unitarios
            total_quantity=Sum('quantity'),  # Cantidad total comprada
            occurrences=Count('id'),  # Número de veces comprado
            avg_price=Avg('price')  # Precio promedio
        ).order_by('-total_spent')[:3]
        
        top_products = []
        for i, product in enumerate(products_spending, 1):
            # Obtener información adicional del producto
            product_instances = Product.objects.filter(name=product['name']).select_related('receipt')
            
            # Supermercados donde se ha comprado
            supermarkets = list(set([p.receipt.supermarket_name for p in product_instances]))
            
            # Última compra
            last_purchase = max(product_instances, key=lambda x: x.receipt.date)
            
            top_products.append({
                'rank': i,
                'name': product['name'],
                'total_spent': float(product['total_spent']),
                'total_quantity': product['total_quantity'],
                'occurrences': product['occurrences'],
                'avg_price': float(product['avg_price']),
                'supermarkets': supermarkets,
                'last_purchase': {
                    'date': last_purchase.receipt.date.strftime('%Y-%m-%d'),
                    'supermarket': last_purchase.receipt.supermarket_name,
                    'price': float(last_purchase.price)
                }
            })
        
        return JsonResponse({
            'success': True,
            'top_products': top_products,
            'total_products_analyzed': Product.objects.values('name').distinct().count()
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
@require_http_methods(["GET"])
def get_price_changes(request):
    """API endpoint para obtener cambios de precio de un producto a lo largo del tiempo"""
    product_name = request.GET.get('product_name')
    
    if not product_name:
        return JsonResponse({'error': 'Parámetro product_name es requerido'}, status=400)
    
    try:
        # Buscar productos que contengan el nombre
        products = Product.objects.filter(
            name__icontains=product_name
        ).select_related('receipt').order_by('receipt__date')
        
        if not products:
            return JsonResponse({
                'success': True,
                'product_name': product_name,
                'message': 'No se encontraron productos con ese nombre',
                'price_history': []
            })
        
        # Crear historial de precios
        price_history = []
        previous_price = None
        
        for product in products:
            current_price = float(product.price)
            price_change = None
            price_change_percentage = None
            
            if previous_price is not None:
                price_change = current_price - previous_price
                price_change_percentage = ((current_price - previous_price) / previous_price) * 100
            
            price_history.append({
                'date': product.receipt.date.strftime('%Y-%m-%d'),
                'price': current_price,
                'supermarket': product.receipt.supermarket_name,
                'quantity': product.quantity,
                'receipt_id': product.receipt.id,
                'price_change': price_change,
                'price_change_percentage': round(price_change_percentage, 2) if price_change_percentage else None
            })
            
            previous_price = current_price
        
        # Calcular estadísticas
        prices = [item['price'] for item in price_history]
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
        
        # Encontrar mayor incremento y decremento
        changes = [item for item in price_history if item['price_change'] is not None]
        biggest_increase = max(changes, key=lambda x: x['price_change']) if changes else None
        biggest_decrease = min(changes, key=lambda x: x['price_change']) if changes else None
        
        return JsonResponse({
            'success': True,
            'product_name': product_name,
            'price_statistics': {
                'min_price': min_price,
                'max_price': max_price,
                'avg_price': round(avg_price, 2),
                'price_range': max_price - min_price,
                'total_observations': len(price_history)
            },
            'biggest_increase': biggest_increase,
            'biggest_decrease': biggest_decrease,
            'price_history': price_history
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
@csrf_exempt
@require_http_methods(["POST"])
def get_cheapest_basket(request):
    """API endpoint para encontrar la cesta más barata de productos entre supermercados"""
    
    try:
        # Parsear JSON del body
        try:
            data = json.loads(request.body)
            product_cart = data.get('products', [])
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        
        if not product_cart:
            return JsonResponse({'error': 'Lista de productos vacía'}, status=400)
        
        # product_cart debería ser una lista de {"name": "producto", "quantity": 1}
        supermarket_totals = defaultdict(lambda: {'total': 0, 'products_found': [], 'products_missing': []})
        
        for cart_item in product_cart:
            product_name = cart_item.get('name')
            desired_quantity = cart_item.get('quantity', 1)
            
            if not product_name:
                continue
            
            # Buscar el producto en cada supermercado (precio más reciente)
            supermarket_prices = {}
            
            # Obtener el precio más reciente de cada supermercado para este producto
            supermarkets = Receipt.objects.values_list('supermarket_name', flat=True).distinct()
            
            for supermarket in supermarkets:
                latest_product = Product.objects.filter(
                    name__icontains=product_name,
                    receipt__supermarket_name=supermarket
                ).select_related('receipt').order_by('-receipt__date').first()
                
                if latest_product:
                    supermarket_prices[supermarket] = float(latest_product.price)
            
            # Añadir a cada supermercado
            for supermarket in supermarkets:
                if supermarket in supermarket_prices:
                    price = supermarket_prices[supermarket]
                    total_price = price * desired_quantity
                    
                    supermarket_totals[supermarket]['total'] += total_price
                    supermarket_totals[supermarket]['products_found'].append({
                        'name': product_name,
                        'unit_price': price,
                        'quantity': desired_quantity,
                        'total_price': total_price
                    })
                else:
                    supermarket_totals[supermarket]['products_missing'].append({
                        'name': product_name,
                        'quantity': desired_quantity
                    })
        
        # Convertir a lista y filtrar solo supermercados que tienen todos los productos
        complete_baskets = []
        partial_baskets = []
        
        for supermarket, data in supermarket_totals.items():
            basket_info = {
                'supermarket': supermarket,
                'total_cost': round(data['total'], 2),
                'products_found': len(data['products_found']),
                'products_missing': len(data['products_missing']),
                'products_detail': data['products_found'],
                'missing_products': data['products_missing']
            }
            
            if len(data['products_missing']) == 0:
                complete_baskets.append(basket_info)
            else:
                partial_baskets.append(basket_info)
        
        # Ordenar por precio total
        complete_baskets.sort(key=lambda x: x['total_cost'])
        partial_baskets.sort(key=lambda x: x['total_cost'])
        
        return JsonResponse({
            'success': True,
            'requested_products': len(product_cart),
            'cheapest_complete_basket': complete_baskets[0] if complete_baskets else None,
            'complete_baskets': complete_baskets,
            'partial_baskets': partial_baskets,
            'message': 'Cestas completas encontradas' if complete_baskets else 'No se encontraron cestas completas'
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
@require_http_methods(["GET"])
def get_supermarket_ranking(request):
    """API endpoint para obtener ranking de supermercados basado en precios"""
    
    try:
        # Calcular estadísticas por supermercado
        supermarket_stats = Receipt.objects.values('supermarket_name').annotate(
            total_receipts=Count('id'),
            total_spent=Sum('total_amount'),
            avg_receipt_amount=Avg('total_amount'),
            total_products=Sum('products__quantity'),
            unique_products=Count('products__name', distinct=True)
        ).order_by('avg_receipt_amount')
        
        # Calcular precio promedio por producto en cada supermercado
        supermarket_rankings = []
        
        for i, supermarket in enumerate(supermarket_stats, 1):
            # Calcular precio promedio por producto
            products = Product.objects.filter(receipt__supermarket_name=supermarket['supermarket_name'])
            
            if products.exists():
                avg_product_price = products.aggregate(avg_price=Avg('price'))['avg_price']
                
                # Obtener fecha del último recibo
                last_receipt = Receipt.objects.filter(
                    supermarket_name=supermarket['supermarket_name']
                ).order_by('-date').first()
                
                # Productos más comunes en este supermercado
                top_products = products.values('name').annotate(
                    count=Count('id')
                ).order_by('-count')[:3]
                
                supermarket_rankings.append({
                    'rank': i,
                    'supermarket': supermarket['supermarket_name'],
                    'score': round(float(avg_product_price), 2),
                    'avg_receipt_amount': round(float(supermarket['avg_receipt_amount']), 2),
                    'total_receipts': supermarket['total_receipts'],
                    'total_spent': round(float(supermarket['total_spent']), 2),
                    'total_products_bought': supermarket['total_products'] or 0,
                    'unique_products': supermarket['unique_products'],
                    'avg_product_price': round(float(avg_product_price), 2),
                    'last_visit': last_receipt.date.strftime('%Y-%m-%d') if last_receipt else None,
                    'top_products': [p['name'] for p in top_products]
                })
        
        # Obtener supermercado más y menos caro
        cheapest = supermarket_rankings[0] if supermarket_rankings else None
        most_expensive = supermarket_rankings[-1] if supermarket_rankings else None
        
        # Calcular estadísticas generales
        all_receipts = Receipt.objects.all()
        general_stats = {
            'total_supermarkets': len(supermarket_rankings),
            'total_receipts': all_receipts.count(),
            'total_spent_overall': float(all_receipts.aggregate(total=Sum('total_amount'))['total'] or 0),
            'avg_receipt_overall': float(all_receipts.aggregate(avg=Avg('total_amount'))['avg'] or 0)
        }
        
        return JsonResponse({
            'success': True,
            'ranking': supermarket_rankings,
            'cheapest_supermarket': cheapest,
            'most_expensive_supermarket': most_expensive,
            'general_statistics': general_stats
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
