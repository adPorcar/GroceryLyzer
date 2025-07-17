from django.db import models

class Receipt(models.Model):
    supermarket_name = models.CharField(max_length=255)
    date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Receipt from {self.supermarket_name} on {self.date}"
    
class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    receipt = models.ForeignKey(Receipt, related_name='products', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} - {self.price}"