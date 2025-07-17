from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileInline(admin.StackedInline):
    """Inline para mostrar el perfil del usuario en la página de edición del usuario"""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Perfil'
    fields = (
        'phone_number', 
        'birth_date', 
        'preferred_supermarket',
        'email_notifications', 
        'price_alerts',
        'total_receipts_processed',
        'total_amount_spent'
    )
    readonly_fields = ('total_receipts_processed', 'total_amount_spent')

class CustomUserAdmin(UserAdmin):
    """Admin personalizado para el modelo User que incluye el perfil"""
    inlines = (UserProfileInline,)
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super(CustomUserAdmin, self).get_inline_instances(request, obj)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin para gestionar los perfiles de usuario directamente"""
    list_display = (
        'user', 
        'preferred_supermarket', 
        'email_notifications', 
        'price_alerts',
        'total_receipts_processed',
        'total_amount_spent',
        'created_at'
    )
    list_filter = (
        'preferred_supermarket', 
        'email_notifications', 
        'price_alerts',
        'created_at'
    )
    search_fields = ('user__username', 'user__email', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Información Personal', {
            'fields': ('phone_number', 'birth_date')
        }),
        ('Preferencias', {
            'fields': ('preferred_supermarket', 'email_notifications', 'price_alerts')
        }),
        ('Estadísticas', {
            'fields': ('total_receipts_processed', 'total_amount_spent'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Hacer campos de solo lectura según el contexto"""
        readonly = list(self.readonly_fields)
        if obj:  # Editando un objeto existente
            readonly.extend(['total_receipts_processed', 'total_amount_spent'])
        return readonly

# Desregistrar el UserAdmin por defecto y registrar el personalizado
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
