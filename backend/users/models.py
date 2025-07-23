from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    """Extended user profile with additional fields for GroceryLyzer"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Contact information
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    price_alerts = models.BooleanField(default=True)
    
    # Statistics
    total_receipts_processed = models.IntegerField(default=0)
    total_amount_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
