from django.contrib.auth import login, logout, authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db import models
from .models import UserProfile
import json
@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    """API endpoint para registrar un nuevo usuario"""
    try:
        # Parsear JSON del body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        
        username = data.get('username')
        password1 = data.get('password1')
        password2 = data.get('password2')
        email = data.get('email', '')
        
        # Validaciones básicas
        if not username or not password1 or not password2:
            return JsonResponse({'error': 'Username, password1 y password2 son requeridos'}, status=400)
        
        if password1 != password2:
            return JsonResponse({'error': 'Las contraseñas no coinciden'}, status=400)
        
        if len(password1) < 8:
            return JsonResponse({'error': 'La contraseña debe tener al menos 8 caracteres'}, status=400)
        
        # Verificar si el usuario ya existe
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'El usuario ya existe'}, status=400)
        
        # Crear el usuario
        user = User.objects.create_user(
            username=username,
            password=password1,
            email=email
        )
        
        # Auto-login después del registro
        login(request, user)
        
        return JsonResponse({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, status=201)
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
@csrf_exempt
@require_http_methods(["POST"])
def user_login(request):
    """API endpoint para login de usuario"""
    try:
        # Parsear JSON del body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        
        username = data.get('username')
        password = data.get('password')
        
        # Validaciones básicas
        if not username or not password:
            return JsonResponse({'error': 'Username y password son requeridos'}, status=400)
        
        # Autenticar usuario
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            return JsonResponse({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else None,
                    'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                }
            })
        else:
            return JsonResponse({'error': 'Credenciales inválidas'}, status=401)
            
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)
@csrf_exempt
@require_http_methods(["POST"])
def user_logout(request):
    """API endpoint para logout de usuario"""
    try:
        if request.user.is_authenticated:
            username = request.user.username
            logout(request)
            return JsonResponse({
                'success': True,
                'message': f'Usuario {username} desconectado exitosamente'
            })
        else:
            return JsonResponse({'error': 'No hay usuario autenticado'}, status=400)
            
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@require_http_methods(["GET"])
def user_profile(request):
    """API endpoint para obtener perfil del usuario autenticado"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Usuario no autenticado'}, status=401)
        
        user = request.user
        
        # Obtener o crear el perfil del usuario
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Obtener estadísticas del usuario (recibos asociados)
        from receipts.models import Receipt
        user_receipts = Receipt.objects.filter()  # Aquí podrías filtrar por usuario si tienes esa relación
        
        # Actualizar estadísticas en el perfil
        profile.total_receipts_processed = user_receipts.count()
        profile.total_amount_spent = sum(receipt.total_amount for receipt in user_receipts)
        profile.save()
        
        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else None,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                'is_staff': user.is_staff,
                'is_active': user.is_active
            },
            'profile': {
                'phone_number': profile.phone_number,
                'birth_date': profile.birth_date.strftime('%Y-%m-%d') if profile.birth_date else None,
                'email_notifications': profile.email_notifications,
                'price_alerts': profile.price_alerts,
                'created_at': profile.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': profile.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            },
            'statistics': {
                'total_receipts': profile.total_receipts_processed,
                'total_spent': float(profile.total_amount_spent),
                'average_per_receipt': float(profile.total_amount_spent / profile.total_receipts_processed) if profile.total_receipts_processed > 0 else 0
            }
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def update_profile(request):
    """API endpoint para actualizar perfil del usuario"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Usuario no autenticado'}, status=401)
        
        # Parsear JSON del body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        
        user = request.user
        
        # Obtener o crear el perfil del usuario
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Actualizar campos del usuario base
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            # Verificar que el email no esté en uso por otro usuario
            if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
                return JsonResponse({'error': 'Este email ya está en uso'}, status=400)
            user.email = data['email']
        
        # Actualizar campos del perfil extendido
        if 'phone_number' in data:
            profile.phone_number = data['phone_number']
        if 'birth_date' in data:
            from datetime import datetime
            try:
                if data['birth_date']:
                    profile.birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
                else:
                    profile.birth_date = None
            except ValueError:
                return JsonResponse({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, status=400)
        if 'email_notifications' in data:
            profile.email_notifications = bool(data['email_notifications'])
        if 'price_alerts' in data:
            profile.price_alerts = bool(data['price_alerts'])
        
        # Guardar cambios
        user.save()
        profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Perfil actualizado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'profile': {
                'phone_number': profile.phone_number,
                'birth_date': profile.birth_date.strftime('%Y-%m-%d') if profile.birth_date else None,
                'email_notifications': profile.email_notifications,
                'price_alerts': profile.price_alerts
            }
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def change_password(request):
    """API endpoint para cambiar contraseña del usuario"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Usuario no autenticado'}, status=401)
        
        # Parsear JSON del body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Validaciones
        if not old_password or not new_password or not confirm_password:
            return JsonResponse({'error': 'Todos los campos son requeridos'}, status=400)
        
        if new_password != confirm_password:
            return JsonResponse({'error': 'Las nuevas contraseñas no coinciden'}, status=400)
        
        if len(new_password) < 8:
            return JsonResponse({'error': 'La nueva contraseña debe tener al menos 8 caracteres'}, status=400)
        
        # Verificar contraseña actual
        if not request.user.check_password(old_password):
            return JsonResponse({'error': 'Contraseña actual incorrecta'}, status=400)
        
        # Cambiar contraseña
        request.user.set_password(new_password)
        request.user.save()
        
        # Re-autenticar usuario con la nueva contraseña
        login(request, request.user)
        
        return JsonResponse({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)