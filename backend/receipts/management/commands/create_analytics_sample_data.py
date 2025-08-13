from django.core.management.base import BaseCommand
from receipts.models import Receipt, Product
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Crear datos de ejemplo optimizados para el dashboard de analytics'

    def handle(self, *args, **options):
        # Limpiar datos existentes (opcional)
        self.stdout.write('Creando datos de ejemplo optimizados para analytics...')
        
        # Supermercados de ejemplo con diferentes rangos de precios
        supermarkets = [
            {'name': 'Mercadona', 'price_multiplier': (0.9, 1.1)},
            {'name': 'Carrefour', 'price_multiplier': (0.95, 1.15)},
            {'name': 'El Corte Inglés', 'price_multiplier': (1.1, 1.3)},
            {'name': 'Lidl', 'price_multiplier': (0.8, 1.0)},
            {'name': 'Alcampo', 'price_multiplier': (0.85, 1.05)}
        ]
        
        # Productos principales que aparecerán frecuentemente (TOP 3 productos)
        top_products = [
            {'name': 'Leche Entera 1L', 'base_price': 1.20, 'frequency': 0.8},
            {'name': 'Pan de Molde Integral', 'base_price': 1.80, 'frequency': 0.7},
            {'name': 'Aceite de Oliva Virgen Extra 1L', 'base_price': 5.50, 'frequency': 0.6},
        ]
        
        # Productos secundarios
        secondary_products = [
            {'name': 'Arroz Bomba 1kg', 'base_price': 2.30, 'frequency': 0.4},
            {'name': 'Pollo Filetes 1kg', 'base_price': 7.50, 'frequency': 0.5},
            {'name': 'Tomates Cherry 500g', 'base_price': 2.10, 'frequency': 0.4},
            {'name': 'Plátanos 1kg', 'base_price': 1.60, 'frequency': 0.3},
            {'name': 'Yogur Natural Pack 8', 'base_price': 2.80, 'frequency': 0.4},
            {'name': 'Pasta Penne 500g', 'base_price': 1.40, 'frequency': 0.3},
            {'name': 'Detergente Líquido 3L', 'base_price': 12.50, 'frequency': 0.2},
            {'name': 'Papel Higiénico 18 rollos', 'base_price': 9.20, 'frequency': 0.2},
            {'name': 'Café Molido Premium 250g', 'base_price': 4.80, 'frequency': 0.3},
            {'name': 'Atún en Aceite Pack 6', 'base_price': 8.40, 'frequency': 0.3},
            {'name': 'Cerveza Premium Pack 6', 'base_price': 6.90, 'frequency': 0.2},
            {'name': 'Queso Manchego Curado 300g', 'base_price': 8.60, 'frequency': 0.2}
        ]
        
        all_products = top_products + secondary_products
        
        # Crear recibos de los últimos 18 meses para tener mejor distribución temporal
        start_date = datetime.now() - timedelta(days=540)  # 18 meses
        
        # Crear más recibos para mejores estadísticas
        for i in range(200):  # 200 recibos
            # Fecha aleatoria con mayor concentración en meses recientes
            if random.random() < 0.6:  # 60% en los últimos 6 meses
                random_days = random.randint(0, 180)
            else:  # 40% en los 12 meses anteriores
                random_days = random.randint(180, 540)
                
            receipt_date = start_date + timedelta(days=random_days)
            
            # Supermercado aleatorio
            supermarket_info = random.choice(supermarkets)
            supermarket_name = supermarket_info['name']
            price_mult_range = supermarket_info['price_multiplier']
            
            # Crear recibo
            receipt = Receipt.objects.create(
                supermarket_name=supermarket_name,
                date=receipt_date.date(),
                total_amount=0  # Se calculará después
            )
            
            # Seleccionar productos para este recibo
            products_in_receipt = []
            
            # Asegurar que los TOP 3 productos aparezcan frecuentemente
            for product in top_products:
                if random.random() < product['frequency']:
                    products_in_receipt.append(product)
            
            # Añadir algunos productos secundarios
            num_secondary = random.randint(2, 6)
            for product in random.sample(secondary_products, min(num_secondary, len(secondary_products))):
                if random.random() < product['frequency']:
                    products_in_receipt.append(product)
            
            total_amount = 0
            
            for product_data in products_in_receipt:
                # Calcular precio con variaciones
                base_price = product_data['base_price']
                
                # Variación por supermercado
                supermarket_multiplier = random.uniform(*price_mult_range)
                
                # Variación temporal (inflación/ofertas)
                days_from_start = (receipt_date.date() - start_date.date()).days
                time_multiplier = 1 + (days_from_start / 540) * 0.1  # Inflación del 10% en 18 meses
                
                # Variación aleatoria pequeña
                random_variation = random.uniform(0.95, 1.05)
                
                final_price = round(
                    base_price * supermarket_multiplier * time_multiplier * random_variation, 
                    2
                )
                
                # Cantidad (generalmente 1, pero a veces más)
                quantity = random.choices([1, 2, 3], weights=[70, 25, 5])[0]
                
                Product.objects.create(
                    name=product_data['name'],
                    price=final_price,
                    quantity=quantity,
                    receipt=receipt
                )
                
                total_amount += final_price * quantity
            
            # Actualizar total del recibo
            receipt.total_amount = round(total_amount, 2)
            receipt.save()
        
        # Estadísticas finales
        total_receipts = Receipt.objects.count()
        total_products = Product.objects.count()
        
        # Verificar que los TOP 3 productos tengan suficientes datos
        for product in top_products:
            product_count = Product.objects.filter(name=product['name']).count()
            self.stdout.write(f"  - {product['name']}: {product_count} apariciones")
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Se crearon {total_receipts} recibos con {total_products} productos')
        )
        self.stdout.write(
            self.style.SUCCESS('✅ Datos optimizados para analytics:')
        )
        self.stdout.write(f'  - TOP 3 productos con historial de precios extenso')
        self.stdout.write(f'  - {len(supermarkets)} supermercados con diferentes rangos de precios')
        self.stdout.write(f'  - Distribución temporal de 18 meses')
        self.stdout.write(f'  - Variaciones de precio realistas')
