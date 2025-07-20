import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface Translation {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('es');
  public currentLanguage$ = this.currentLanguage.asObservable();
  private isBrowser: boolean;

  private translations: { [lang: string]: Translation } = {
    es: {
      // Navigation
      'nav.home': 'Inicio',
      'nav.receipts': 'Recibos',
      'nav.analytics': 'Analíticas',
      'nav.profile': 'Perfil',
      'nav.logout': 'Cerrar Sesión',
      
      // User session
      'user.welcome': 'Bienvenido,',
      'user.notLoggedIn': 'No has iniciado sesión',
      
      // Welcome Section
      'welcome.title': '¡Bienvenido a GroceryLyzer! 🛒',
      'welcome.subtitle': 'Tu asistente inteligente para analizar gastos de supermercado',
      
      // Features
      'feature.scan.title': 'Escanea Recibos',
      'feature.scan.description': 'Sube tus recibos en PDF y nuestra IA extraerá automáticamente todos los productos, precios y datos importantes usando tecnología OCR avanzada.',
      'feature.scan.button': 'Subir Recibo',
      
      'feature.analytics.title': 'Analiza Gastos',
      'feature.analytics.description': 'Visualiza tendencias, compara precios entre supermercados, identifica productos más caros y descubre patrones en tus compras.',
      'feature.analytics.button': 'Ver Analytics',
      
      'feature.savings.title': 'Ahorra Dinero',
      'feature.savings.description': 'Encuentra la cesta más barata, recibe alertas de subidas de precios y optimiza tu presupuesto familiar con recomendaciones inteligentes.',
      'feature.savings.button': 'Optimizar Gastos',
      
      // Receipts
      'receipts.description': 'Sube y gestiona todos tus recibos de compras',
      'receipts.upload.title': 'Arrastra y suelta tu recibo aquí',
      'receipts.upload.subtitle': 'O haz clic para seleccionar archivos (PDF, JPG, PNG)',
      'receipts.list.title': 'Mis Recibos',
      'receipts.list.empty': 'No tienes recibos todavía. ¡Sube tu primer recibo!',
      
      // Analytics
      'analytics.description': 'Analiza tus patrones de gasto y encuentra oportunidades de ahorro',
      'analytics.total.spent': 'Total Gastado',
      'analytics.total.receipts': 'Total Recibos',
      'analytics.total.items': 'Total Productos',
      'analytics.average.monthly': 'Promedio Mensual',
      'analytics.charts.title': 'Gráficos y Tendencias',
      'analytics.charts.nodata': 'No hay datos suficientes para mostrar gráficos. ¡Sube algunos recibos primero!',
      
      // Profile
      'profile.title': 'Perfil de Usuario',
      'profile.subtitle': 'Gestiona tu información personal y preferencias',
      'profile.loading': 'Cargando perfil...',
      'profile.personal.title': 'Información Personal',
      'profile.personal.subtitle': 'Actualiza tus datos personales',
      'profile.form.firstName': 'Nombre',
      'profile.form.firstName.placeholder': 'Tu nombre',
      'profile.form.lastName': 'Apellidos',
      'profile.form.lastName.placeholder': 'Tus apellidos',
      'profile.form.email': 'Correo Electrónico',
      'profile.form.email.placeholder': 'tu@email.com',
      'profile.form.phone': 'Teléfono',
      'profile.form.phone.placeholder': 'Tu número de teléfono',
      'profile.form.birthDate': 'Fecha de Nacimiento',
      'profile.form.updateProfile': 'Actualizar Perfil',
      'profile.form.updating': 'Actualizando...',
      'profile.preferences.title': 'Preferencias',
      'profile.preferences.emailNotifications': 'Notificaciones por Email',
      'profile.preferences.emailNotifications.description': 'Recibir notificaciones sobre actualizaciones y ofertas',
      'profile.preferences.priceAlerts': 'Alertas de Precios',
      'profile.preferences.priceAlerts.description': 'Recibir alertas cuando cambien los precios de productos',
      'profile.security.title': 'Seguridad',
      'profile.security.subtitle': 'Gestiona tu contraseña y seguridad',
      'profile.security.changePassword': 'Cambiar Contraseña',
      'profile.security.cancel': 'Cancelar',
      'profile.password.current': 'Contraseña Actual',
      'profile.password.current.placeholder': 'Tu contraseña actual',
      'profile.password.new': 'Nueva Contraseña',
      'profile.password.new.placeholder': 'Mínimo 8 caracteres',
      'profile.password.confirm': 'Confirmar Contraseña',
      'profile.password.confirm.placeholder': 'Repite la nueva contraseña',
      'profile.password.change': 'Cambiar Contraseña',
      'profile.password.updating': 'Cambiando...',
      'profile.success.title': '¡Perfil Actualizado!',
      'profile.success.message': 'Tus datos han sido actualizados correctamente.',
      
      // Auth Required
      'auth.required.title': 'Inicio de Sesión Requerido',
      'auth.required.message': 'Necesitas iniciar sesión para acceder a esta función.',
      'auth.required.loginButton': 'Iniciar Sesión',
      'auth.required.registerButton': 'Registrarse',
      'auth.required.close': 'Cerrar',
      
      // Footer
      'footer.copyright': 'GroceryLyzer - Analiza tus gastos de supermercado',
      'footer.developed': 'Desarrollado por',
      
      // Language
      'language.spanish': 'Español',
      'language.english': 'English',
      
      // Auth buttons
      'auth.login': 'Inicia sesión',
      'auth.register': 'Regístrate',
      
      // Register
      'register.title': 'Crear Cuenta',
      'register.subtitle': 'Únete comienza a gestionar tus gastos',
      'register.form.username': 'Nombre de Usuario',
      'register.form.username.placeholder': 'Tu nombre de usuario',
      'register.form.name': 'Nombre Completo',
      'register.form.name.placeholder': 'Tu nombre completo',
      'register.form.email': 'Correo Electrónico',
      'register.form.email.placeholder': 'tu@email.com',
      'register.form.password': 'Contraseña',
      'register.form.password.placeholder': 'Mínimo 8 caracteres',
      'register.form.confirmPassword': 'Confirmar Contraseña',
      'register.form.confirmPassword.placeholder': 'Repite tu contraseña',
      'register.form.submit': 'Crear Cuenta',
      'register.form.loading': 'Creando cuenta...',
      'register.hasAccount': '¿Ya tienes cuenta?',
      'register.loginLink': 'Inicia sesión aquí',
      
      // Login
      'login.title': 'Iniciar Sesión',
      'login.subtitle': 'Accede a tu cuenta',
      'login.form.username': 'Nombre de Usuario',
      'login.form.username.placeholder': 'Tu nombre de usuario',
      'login.form.email': 'Correo Electrónico',
      'login.form.email.placeholder': 'tu@email.com',
      'login.form.password': 'Contraseña',
      'login.form.password.placeholder': 'Tu contraseña',
      'login.form.rememberMe': 'Recordarme',
      'login.form.forgotPassword': '¿Olvidaste tu contraseña?',
      'login.form.submit': 'Iniciar Sesión',
      'login.form.loading': 'Iniciando sesión...',
      'login.noAccount': '¿No tienes cuenta?',
      'login.registerLink': 'Regístrate aquí',
      
      // Login success modal
      'login.success.title': '¡Bienvenido!',
      'login.success.message': 'Has iniciado sesión correctamente. Serás redirigido automáticamente.',
      'login.success.redirecting': 'Redirigiendo en unos segundos...',
    },
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.receipts': 'Receipts',
      'nav.analytics': 'Analytics',
      'nav.profile': 'Profile',
      'nav.logout': 'Sign Out',
      
      // User session
      'user.welcome': 'Welcome,',
      'user.notLoggedIn': 'Not logged in',
      
      // Welcome Section
      'welcome.title': 'Welcome to GroceryLyzer! 🛒',
      'welcome.subtitle': 'Your smart assistant to analyze grocery expenses',
      
      // Features
      'feature.scan.title': 'Scan Receipts',
      'feature.scan.description': 'Upload your PDF receipts and our AI will automatically extract all products, prices and important data using advanced OCR technology.',
      'feature.scan.button': 'Upload Receipt',
      
      'feature.analytics.title': 'Analyze Expenses',
      'feature.analytics.description': 'Visualize trends, compare prices between supermarkets, identify most expensive products and discover patterns in your purchases.',
      'feature.analytics.button': 'View Analytics',
      
      'feature.savings.title': 'Save Money',
      'feature.savings.description': 'Find the cheapest basket, receive price increase alerts and optimize your family budget with smart recommendations.',
      'feature.savings.button': 'Optimize Expenses',
      
      // Receipts
      'receipts.description': 'Upload and manage all your shopping receipts',
      'receipts.upload.title': 'Drag and drop your receipt here',
      'receipts.upload.subtitle': 'Or click to select files (PDF, JPG, PNG)',
      'receipts.list.title': 'My Receipts',
      'receipts.list.empty': 'You don\'t have any receipts yet. Upload your first receipt!',
      
      // Analytics
      'analytics.description': 'Analyze your spending patterns and find saving opportunities',
      'analytics.total.spent': 'Total Spent',
      'analytics.total.receipts': 'Total Receipts',
      'analytics.total.items': 'Total Items',
      'analytics.average.monthly': 'Monthly Average',
      'analytics.charts.title': 'Charts and Trends',
      'analytics.charts.nodata': 'Not enough data to show charts. Upload some receipts first!',
      
      // Profile
      'profile.title': 'User Profile',
      'profile.subtitle': 'Manage your personal information and preferences',
      'profile.loading': 'Loading profile...',
      'profile.personal.title': 'Personal Information',
      'profile.personal.subtitle': 'Update your personal details',
      'profile.form.firstName': 'First Name',
      'profile.form.firstName.placeholder': 'Your first name',
      'profile.form.lastName': 'Last Name',
      'profile.form.lastName.placeholder': 'Your last name',
      'profile.form.email': 'Email Address',
      'profile.form.email.placeholder': 'your@email.com',
      'profile.form.phone': 'Phone Number',
      'profile.form.phone.placeholder': 'Your phone number',
      'profile.form.birthDate': 'Date of Birth',
      'profile.form.updateProfile': 'Update Profile',
      'profile.form.updating': 'Updating...',
      'profile.preferences.title': 'Preferences',
      'profile.preferences.emailNotifications': 'Email Notifications',
      'profile.preferences.emailNotifications.description': 'Receive notifications about updates and offers',
      'profile.preferences.priceAlerts': 'Price Alerts',
      'profile.preferences.priceAlerts.description': 'Receive alerts when product prices change',
      'profile.security.title': 'Security',
      'profile.security.subtitle': 'Manage your password and security',
      'profile.security.changePassword': 'Change Password',
      'profile.security.cancel': 'Cancel',
      'profile.password.current': 'Current Password',
      'profile.password.current.placeholder': 'Your current password',
      'profile.password.new': 'New Password',
      'profile.password.new.placeholder': 'Minimum 8 characters',
      'profile.password.confirm': 'Confirm Password',
      'profile.password.confirm.placeholder': 'Repeat the new password',
      'profile.password.change': 'Change Password',
      'profile.password.updating': 'Updating...',
      'profile.success.title': 'Profile Updated!',
      'profile.success.message': 'Your information has been updated successfully.',
      
      // Auth Required
      'auth.required.title': 'Login Required',
      'auth.required.message': 'You need to log in to access this feature.',
      'auth.required.loginButton': 'Log In',
      'auth.required.registerButton': 'Sign Up',
      'auth.required.close': 'Close',
      
      // Footer
      'footer.copyright': 'GroceryLyzer - Analyze your grocery expenses',
      'footer.developed': 'Developed by',
      
      // Language
      'language.spanish': 'Español',
      'language.english': 'English',
      
      // Auth buttons
      'auth.login': 'Sign In',
      'auth.register': 'Sign Up',
      
      // Register
      'register.title': 'Create Account',
      'register.subtitle': 'Join and start managing your expenses',
      'register.form.username': 'Username',
      'register.form.username.placeholder': 'Your username',
      'register.form.name': 'Full Name',
      'register.form.name.placeholder': 'Your full name',
      'register.form.email': 'Email Address',
      'register.form.email.placeholder': 'your@email.com',
      'register.form.password': 'Password',
      'register.form.password.placeholder': 'Minimum 8 characters',
      'register.form.confirmPassword': 'Confirm Password',
      'register.form.confirmPassword.placeholder': 'Repeat your password',
      'register.form.submit': 'Create Account',
      'register.form.loading': 'Creating account...',
      'register.hasAccount': 'Already have an account?',
      'register.loginLink': 'Sign in here',
      
      // Login
      'login.title': 'Sign In',
      'login.subtitle': 'Access your account',
      'login.form.username': 'Username',
      'login.form.username.placeholder': 'Enter your username',
      'login.form.email': 'Email Address',
      'login.form.email.placeholder': 'your@email.com',
      'login.form.password': 'Password',
      'login.form.password.placeholder': 'Your password',
      'login.form.rememberMe': 'Remember me',
      'login.form.forgotPassword': 'Forgot your password?',
      'login.form.submit': 'Sign In',
      'login.form.loading': 'Signing in...',
      'login.noAccount': "Don't have an account?",
      'login.registerLink': 'Sign up here',
      
      // Login success modal
      'login.success.title': 'Welcome!',
      'login.success.message': 'You have successfully logged in. You will be redirected automatically.',
      'login.success.redirecting': 'Redirecting in a few seconds...',
    }
  };

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  setLanguage(lang: string): void {
    this.currentLanguage.next(lang);
    if (this.isBrowser) {
      localStorage.setItem('preferred-language', lang);
    }
  }

  translate(key: string): string {
    const currentLang = this.getCurrentLanguage();
    return this.translations[currentLang]?.[key] || key;
  }

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Load saved language preference only if in browser
    if (this.isBrowser) {
      const savedLang = localStorage.getItem('preferred-language');
      if (savedLang && this.translations[savedLang]) {
        this.currentLanguage.next(savedLang);
      }
    }
  }
}
