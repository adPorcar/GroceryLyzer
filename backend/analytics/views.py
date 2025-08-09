from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Avg, Count, Max, Min, Q
from django.db.models.functions import TruncMonth, TruncWeek, TruncYear, TruncDay
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

@require_http_methods(["GET"])
def get_dashboard_overview(request):
    """API endpoint para obtener datos generales del dashboard"""
    
    # Filtros de fecha
    year = request.GET.get('year')
    month = request.GET.get('month')
    week = request.GET.get('week')
    
    try:
        # Base queryset
        receipts_query = Receipt.objects.all()
        products_query = Product.objects.all()
        
        # Aplicar filtros de fecha
        if year:
            receipts_query = receipts_query.filter(date__year=year)
            products_query = products_query.filter(receipt__date__year=year)
        
        if month:
            receipts_query = receipts_query.filter(date__month=month)
            products_query = products_query.filter(receipt__date__month=month)
        
        if week:
            # Filtrar por semana del año
            receipts_query = receipts_query.filter(date__week=week)
            products_query = products_query.filter(receipt__date__week=week)
        
        # Estadísticas básicas
        total_spent = receipts_query.aggregate(total=Sum('total_amount'))['total'] or 0
        total_receipts = receipts_query.count()
        total_products = products_query.aggregate(total=Sum('quantity'))['total'] or 0
        avg_receipt = receipts_query.aggregate(avg=Avg('total_amount'))['avg'] or 0
        
        # Supermercados únicos
        unique_supermarkets = receipts_query.values('supermarket_name').distinct().count()
        
        # Periodo de análisis
        if receipts_query.exists():
            first_receipt = receipts_query.order_by('date').first().date
            last_receipt = receipts_query.order_by('-date').first().date
            days_analyzed = (last_receipt - first_receipt).days + 1
        else:
            first_receipt = None
            last_receipt = None
            days_analyzed = 0
        
        # Gasto por supermercado
        supermarket_spending = receipts_query.values('supermarket_name').annotate(
            total=Sum('total_amount'),
            receipts_count=Count('id'),
            avg_receipt=Avg('total_amount')
        ).order_by('-total')
        
        # Top 3 productos más comprados (por gasto)
        top_products = products_query.values('name').annotate(
            total_spent=Sum('price'),
            total_quantity=Sum('quantity'),
            avg_price=Avg('price')
        ).order_by('-total_spent')[:3]
        
        return JsonResponse({
            'success': True,
            'filters': {
                'year': year,
                'month': month,
                'week': week
            },
            'overview': {
                'total_spent': float(total_spent),
                'total_receipts': total_receipts,
                'total_products': total_products,
                'avg_receipt': round(float(avg_receipt), 2),
                'unique_supermarkets': unique_supermarkets,
                'days_analyzed': days_analyzed,
                'first_receipt': first_receipt.strftime('%Y-%m-%d') if first_receipt else None,
                'last_receipt': last_receipt.strftime('%Y-%m-%d') if last_receipt else None
            },
            'supermarket_spending': [
                {
                    'name': item['supermarket_name'],
                    'total': float(item['total']),
                    'receipts': item['receipts_count'],
                    'avg_receipt': round(float(item['avg_receipt']), 2)
                }
                for item in supermarket_spending
            ],
            'top_products': [
                {
                    'name': item['name'],
                    'total_spent': float(item['total_spent']),
                    'total_quantity': item['total_quantity'],
                    'avg_price': round(float(item['avg_price']), 2)
                }
                for item in top_products
            ]
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@require_http_methods(["GET"])
def get_monthly_comparison(request):
    """API endpoint para comparación mensual con datos para gráfico de barras"""
    
    year = request.GET.get('year')
    
    try:
        # Base queryset
        query = Receipt.objects.all()
        
        if year:
            query = query.filter(date__year=year)
        
        # Agrupar por mes
        monthly_data = query.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total_spent=Sum('total_amount'),
            receipt_count=Count('id'),
            avg_receipt=Avg('total_amount')
        ).order_by('month')
        
        # Formatear datos para el frontend
        months_data = []
        for data in monthly_data:
            months_data.append({
                'month': data['month'].strftime('%Y-%m'),
                'month_name': data['month'].strftime('%B %Y'),
                'total_spent': float(data['total_spent']),
                'receipt_count': data['receipt_count'],
                'avg_receipt': round(float(data['avg_receipt']), 2)
            })
        
        # Encontrar mejor y peor mes
        if months_data:
            best_month = max(months_data, key=lambda x: x['total_spent'])
            worst_month = min(months_data, key=lambda x: x['total_spent'])
        else:
            best_month = None
            worst_month = None
        
        return JsonResponse({
            'success': True,
            'year_filter': year,
            'monthly_data': months_data,
            'insights': {
                'best_month': best_month,
                'worst_month': worst_month,
                'total_months': len(months_data)
            }
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@require_http_methods(["GET"])
def get_price_trends(request):
    """API endpoint para obtener tendencias de precio de los productos más comprados"""
    
    year = request.GET.get('year')
    month = request.GET.get('month')
    
    try:
        # Base queryset
        products_query = Product.objects.select_related('receipt')
        
        # Aplicar filtros
        if year:
            products_query = products_query.filter(receipt__date__year=year)
        if month:
            products_query = products_query.filter(receipt__date__month=month)
        
        # Obtener top 3 productos por gasto total
        top_products = products_query.values('name').annotate(
            total_spent=Sum('price')
        ).order_by('-total_spent')[:3]
        
        trends_data = []
        
        for product_data in top_products:
            product_name = product_data['name']
            
            # Obtener historial de precios para este producto
            price_history = products_query.filter(
                name=product_name
            ).order_by('receipt__date').values(
                'receipt__date', 'price', 'receipt__supermarket_name'
            )
            
            history_list = []
            for item in price_history:
                history_list.append({
                    'date': item['receipt__date'].strftime('%Y-%m-%d'),
                    'price': float(item['price']),
                    'supermarket': item['receipt__supermarket_name']
                })
            
            # Calcular tendencia (simple: precio final vs inicial)
            if len(history_list) > 1:
                initial_price = history_list[0]['price']
                final_price = history_list[-1]['price']
                trend_percentage = ((final_price - initial_price) / initial_price) * 100
            else:
                trend_percentage = 0
            
            trends_data.append({
                'product_name': product_name,
                'total_spent': float(product_data['total_spent']),
                'price_history': history_list,
                'trend_percentage': round(trend_percentage, 2),
                'trend_direction': 'up' if trend_percentage > 0 else 'down' if trend_percentage < 0 else 'stable'
            })
        
        return JsonResponse({
            'success': True,
            'filters': {
                'year': year,
                'month': month
            },
            'price_trends': trends_data
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@require_http_methods(["GET"])
def get_supermarket_savings(request):
    """API endpoint para calcular ahorros potenciales entre supermercados"""
    
    year = request.GET.get('year')
    month = request.GET.get('month')
    
    try:
        # Base queryset
        products_query = Product.objects.select_related('receipt')
        
        # Aplicar filtros
        if year:
            products_query = products_query.filter(receipt__date__year=year)
        if month:
            products_query = products_query.filter(receipt__date__month=month)
        
        # Obtener productos que aparecen en múltiples supermercados
        common_products = products_query.values('name').annotate(
            supermarket_count=Count('receipt__supermarket_name', distinct=True),
            total_purchases=Count('id')
        ).filter(supermarket_count__gt=1).order_by('-total_purchases')[:10]
        
        savings_analysis = []
        
        for product_data in common_products:
            product_name = product_data['name']
            
            # Obtener precios por supermercado para este producto
            supermarket_prices = products_query.filter(
                name=product_name
            ).values('receipt__supermarket_name').annotate(
                avg_price=Avg('price'),
                min_price=Min('price'),
                max_price=Max('price'),
                purchase_count=Count('id')
            ).order_by('avg_price')
            
            if len(supermarket_prices) > 1:
                cheapest = supermarket_prices[0]
                most_expensive = list(supermarket_prices)[-1]
                
                potential_saving = float(most_expensive['avg_price']) - float(cheapest['avg_price'])
                saving_percentage = (potential_saving / float(most_expensive['avg_price'])) * 100
                
                savings_analysis.append({
                    'product_name': product_name,
                    'total_purchases': product_data['total_purchases'],
                    'cheapest_supermarket': {
                        'name': cheapest['receipt__supermarket_name'],
                        'avg_price': round(float(cheapest['avg_price']), 2),
                        'purchase_count': cheapest['purchase_count']
                    },
                    'most_expensive_supermarket': {
                        'name': most_expensive['receipt__supermarket_name'],
                        'avg_price': round(float(most_expensive['avg_price']), 2),
                        'purchase_count': most_expensive['purchase_count']
                    },
                    'potential_saving': round(potential_saving, 2),
                    'saving_percentage': round(saving_percentage, 2),
                    'supermarket_count': product_data['supermarket_count']
                })
        
        # Calcular ahorro total potencial
        total_potential_saving = sum(item['potential_saving'] for item in savings_analysis)
        
        return JsonResponse({
            'success': True,
            'filters': {
                'year': year,
                'month': month
            },
            'savings_analysis': savings_analysis,
            'total_potential_saving': round(total_potential_saving, 2),
            'products_analyzed': len(savings_analysis)
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
