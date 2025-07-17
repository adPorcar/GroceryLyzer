from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('receipts/', include('receipts.urls')),
    path('analytics/', include('analytics.urls')),
    path('users/', include('users.urls'))
]
