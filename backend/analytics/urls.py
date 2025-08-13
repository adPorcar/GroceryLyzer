# analytics/urls.py - API URLs para analytics
from django.urls import path
from . import views

urlpatterns = [
    path('spending-trend/', views.get_spending_trend, name='api_spending_trend'),
    path('compare-prices/', views.compare_supermarket_prices, name='api_compare_prices'),
    path('top-products/', views.get_top_three_products, name='api_top_products'),
    path('price-changes/', views.get_price_changes, name='api_price_changes'),
    path('cheapest-basket/', views.get_cheapest_basket, name='api_cheapest_basket'),
    path('supermarket-ranking/', views.get_supermarket_ranking, name='api_supermarket_ranking'),
    # Nuevos endpoints para el dashboard
    path('dashboard-overview/', views.get_dashboard_overview, name='api_dashboard_overview'),
    path('monthly-comparison/', views.get_monthly_comparison, name='api_monthly_comparison'),
    path('price-trends/', views.get_price_trends, name='api_price_trends'),
    path('supermarket-savings/', views.get_supermarket_savings, name='api_supermarket_savings'),
]
