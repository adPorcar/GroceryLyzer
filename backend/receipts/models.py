from django.db import models

class Receipt(models.Model):
    supermarket_name= models.CharField(max_length=255)
    date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    product_name = models.TextField()  # maybe better class for product ?
    product_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Receipt from {self.supermarket_name} on {self.date}"