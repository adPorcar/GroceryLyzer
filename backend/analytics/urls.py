# analytics/urls.py - API URLs para analytics
from django.urls import path
from . import views

urlpatterns = [
    path('api/spending-trend/', views.get_spending_trend, name='api_spending_trend'),
    path('api/compare-prices/', views.compare_supermarket_prices, name='api_compare_prices'),
    path('api/top-products/', views.get_top_three_products, name='api_top_products'),
    path('api/price-changes/', views.get_price_changes, name='api_price_changes'),
    path('api/cheapest-basket/', views.get_cheapest_basket, name='api_cheapest_basket'),
    path('api/supermarket-ranking/', views.get_supermarket_ranking, name='api_supermarket_ranking'),
]
