# receipts/urls.py - API URLs
from django.urls import path
from . import views

urlpatterns = [
    # Receipts endpoints
    path('api/upload/', views.receipt_upload_view, name='api_receipt_upload'),
    path('api/list/', views.receipt_list_view, name='api_receipt_list'),
    path('api/detail/<int:receipt_id>/', views.receipt_detail_view, name='api_receipt_detail'),
    path('api/update/<int:receipt_id>/', views.receipt_update_view, name='api_receipt_update'),
    path('api/delete/<int:receipt_id>/', views.receipt_delete_view, name='api_receipt_delete'),
    
    # Products endpoints
    path('api/products/', views.products_list_view, name='api_products_list'),
    path('api/products/delete/<int:product_id>/', views.product_delete_view, name='api_product_delete'),
]
