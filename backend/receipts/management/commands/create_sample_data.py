from django.core.management.base import BaseCommand
from receipts.models import Receipt, Product
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Crear datos de ejemplo para el dashboard de analytics'

    def handle(self, *args, **options):
        # Limpiar datos existentes (opcional)
        self.stdout.write('Creando datos de ejemplo...')
        
        # Supermercados de ejemplo
        supermarkets = ['Mercadona', 'Carrefour', 'El Corte Inglés', 'Lidl', 'Alcampo']
        
        # Productos de ejemplo
        products_data = [
            {'name': 'Leche Entera 1L', 'price_range': (0.8, 1.5)},
            {'name': 'Pan de Molde', 'price_range': (1.2, 2.0)},
            {'name': 'Aceite de Oliva 1L', 'price_range': (3.5, 8.0)},
            {'name': 'Arroz 1kg', 'price_range': (1.0, 2.5)},
            {'name': 'Pollo Filetes 1kg', 'price_range': (5.0, 9.0)},
            {'name': 'Tomates 1kg', 'price_range': (1.5, 3.0)},
            {'name': 'Plátanos 1kg', 'price_range': (1.0, 2.0)},
            {'name': 'Yogur Natural Pack 4', 'price_range': (1.5, 3.0)},
            {'name': 'Pasta Espaguetis 500g', 'price_range': (0.8, 2.5)},
            {'name': 'Detergente Líquido 2L', 'price_range': (8.0, 15.0)},
            {'name': 'Papel Higiénico 12 rollos', 'price_range': (6.0, 12.0)},
            {'name': 'Café Molido 250g', 'price_range': (2.5, 6.0)},
            {'name': 'Atún en Conserva Pack 3', 'price_range': (3.0, 6.0)},
            {'name': 'Cerveza Pack 6', 'price_range': (3.5, 8.0)},
            {'name': 'Queso Manchego 200g', 'price_range': (4.0, 12.0)}
        ]
        
        # Crear recibos de los últimos 12 meses
        start_date = datetime.now() - timedelta(days=365)
        
        for i in range(150):  # 150 recibos
            # Fecha aleatoria en los últimos 12 meses
            random_days = random.randint(0, 365)
            receipt_date = start_date + timedelta(days=random_days)
            
            # Supermercado aleatorio
            supermarket = random.choice(supermarkets)
            
            # Crear recibo
            receipt = Receipt.objects.create(
                supermarket_name=supermarket,
                date=receipt_date.date(),
                total_amount=0  # Se calculará después
            )
            
            # Añadir productos al recibo (entre 3 y 8 productos)
            num_products = random.randint(3, 8)
            total_amount = 0
            
            selected_products = random.sample(products_data, min(num_products, len(products_data)))
            
            for product_data in selected_products:
                # Precio con variación por supermercado
                base_min, base_max = product_data['price_range']
                
                # Algunos supermercados son más caros que otros
                if supermarket == 'El Corte Inglés':
                    price_multiplier = random.uniform(1.1, 1.3)
                elif supermarket == 'Lidl':
                    price_multiplier = random.uniform(0.8, 1.0)
                elif supermarket == 'Mercadona':
                    price_multiplier = random.uniform(0.9, 1.1)
                else:
                    price_multiplier = random.uniform(0.95, 1.15)
                
                price = round(random.uniform(base_min, base_max) * price_multiplier, 2)
                quantity = random.randint(1, 3)
                
                Product.objects.create(
                    name=product_data['name'],
                    price=price,
                    quantity=quantity,
                    receipt=receipt
                )
                
                total_amount += price * quantity
            
            # Actualizar total del recibo
            receipt.total_amount = round(total_amount, 2)
            receipt.save()
        
        self.stdout.write(
            self.style.SUCCESS(f'Se crearon {Receipt.objects.count()} recibos con datos de ejemplo')
        )
        self.stdout.write(
            self.style.SUCCESS(f'Se crearon {Product.objects.count()} productos en total')
        )
