# Users API - Grocerylyzer

Módulo de autenticación y gestión de usuarios para el backend Django.

## 🔐 Endpoints Disponibles

### Base URL: `http://localhost:8000/users/api/`

---

## 1. Registro de Usuario
```http
POST /register/
Content-Type: application/json

{
  "username": "john_doe",
  "password1": "mi_password_seguro",
  "password2": "mi_password_seguro",
  "email": "john@example.com"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "date_joined": "2025-07-01 10:30:45"
  }
}
```

**Errores comunes:**
- `400`: Contraseñas no coinciden, usuario ya existe, contraseña muy corta

---

## 2. Login de Usuario
```http
POST /login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "mi_password_seguro"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "last_login": "2025-07-01 15:30:45",
    "date_joined": "2025-07-01 10:30:45"
  }
}
```

**Errores:**
- `401`: Credenciales inválidas
- `400`: Campos faltantes

---

## 3. Logout de Usuario
```http
POST /logout/
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Usuario john_doe desconectado exitosamente"
}
```

**Errores:**
- `400`: No hay usuario autenticado

---

## 4. Perfil del Usuario
```http
GET /profile/
```
*Requiere autenticación*

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "last_login": "2025-07-01 15:30:45",
    "date_joined": "2025-07-01 10:30:45",
    "is_staff": false,
    "is_active": true
  },
  "statistics": {
    "total_receipts": 12,
    "total_spent": 345.67
  }
}
```

**Errores:**
- `401`: Usuario no autenticado

---

## 5. Actualizar Perfil
```http
PUT /update-profile/
Content-Type: application/json

{
  "first_name": "Johnny",
  "last_name": "Smith",
  "email": "johnny.smith@example.com"
}
```
*Requiere autenticación*

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "johnny.smith@example.com",
    "first_name": "Johnny",
    "last_name": "Smith"
  }
}
```

**Errores:**
- `401`: Usuario no autenticado
- `400`: Email ya en uso

---

## 6. Cambiar Contraseña
```http
POST /change-password/
Content-Type: application/json

{
  "old_password": "mi_password_actual",
  "new_password": "mi_nuevo_password",
  "confirm_password": "mi_nuevo_password"
}
```
*Requiere autenticación*

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

**Errores:**
- `401`: Usuario no autenticado
- `400`: Contraseña actual incorrecta, contraseñas nuevas no coinciden

---

## 🔒 Seguridad y Validaciones

### Validaciones de Registro:
- ✅ Username único
- ✅ Contraseña mínimo 8 caracteres
- ✅ Confirmación de contraseña
- ✅ Email válido (opcional)

### Validaciones de Login:
- ✅ Credenciales correctas
- ✅ Usuario activo

### Validaciones de Cambio de Contraseña:
- ✅ Contraseña actual correcta
- ✅ Nueva contraseña mínimo 8 caracteres
- ✅ Confirmación de nueva contraseña

## 🍪 Sesiones

El sistema utiliza las sesiones de Django por defecto:
- Las sesiones se mantienen después del login
- Se destruyen en el logout
- Se mantienen activas hasta el timeout configurado

## 🔄 Integración con Frontend

### Flujo típico de autenticación:

1. **Registro**: `POST /users/api/register/`
2. **Login automático**: El usuario queda autenticado
3. **Usar la aplicación**: Las demás APIs funcionan con la sesión
4. **Logout**: `POST /users/api/logout/` cuando termine

### Headers necesarios:
```javascript
// Para POST requests
headers: {
  'Content-Type': 'application/json',
  'X-CSRFToken': csrfToken  // Si usas CSRF (recomendado)
}
```

### Manejo de errores en frontend:
```javascript
// Ejemplo en Angular/JavaScript
if (response.status === 401) {
  // Redirigir a login
  router.navigate(['/login']);
} else if (response.status === 400) {
  // Mostrar errores de validación
  console.error(response.data.error);
}
```

## 📊 Estadísticas de Usuario

El endpoint `/profile/` incluye estadísticas básicas:
- **total_receipts**: Número de recibos procesados
- **total_spent**: Gasto total en todos los recibos

*Nota: Actualmente las estadísticas son globales. Para asociar recibos a usuarios específicos, necesitarías añadir un ForeignKey al modelo Receipt.*

## ⚙️ Configuración

Las siguientes configuraciones en `settings.py` afectan la autenticación:

```python
# Tiempo de expiración de sesión (en segundos)
SESSION_COOKIE_AGE = 1209600  # 2 semanas

# Si las sesiones expiran al cerrar el navegador
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Configuración de CORS para permitir cookies desde frontend
CORS_ALLOW_CREDENTIALS = True
```
