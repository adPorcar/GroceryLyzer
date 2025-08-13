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
      'receipts.title': 'Recibos',
      'receipts.description': 'Gestiona y analiza tus recibos de supermercado',
      'receipts.upload.click': 'Haz clic para subir',
      'receipts.upload.dragdrop': 'o arrastra y suelta',
      'receipts.upload.format': 'PDF de recibo de supermercado (MAX. 10MB)',
      'receipts.file.selected': 'Archivo seleccionado',
      'receipts.file.remove': 'Eliminar archivo',
      'receipts.upload.process': 'Procesar Recibo',
      'receipts.upload.processing': 'Procesando recibo...',
      'receipts.list.title': 'Lista de Recibos',
      'receipts.list.empty': 'No hay recibos',
      'receipts.list.empty.subtitle': 'Sube tu primer recibo para comenzar',
      'receipts.error.load': 'Error al cargar los recibos',
      'receipts.retry': 'Reintentar',
      'receipts.loading': 'Conectando con el servidor...',
      'receipts.loading.update': 'Actualizando recibos...',
      'receipts.card.total': 'Total',
      'receipts.card.products': 'Productos',
      'receipts.card.view': 'Ver detalles',
      'receipts.card.delete': 'Eliminar',
      'receipts.detail.title': 'Detalles del Recibo',
      'receipts.detail.loading': 'Cargando detalles...',
      'receipts.detail.supermarket': 'Supermercado:',
      'receipts.detail.date': 'Fecha:',
      'receipts.detail.total': 'Total:',
      'receipts.detail.products': 'Productos:',
      'receipts.detail.items': 'artículos',
      'receipts.detail.products.list': 'Lista de Productos',
      'receipts.detail.product.quantity': 'Cantidad:',
      'receipts.detail.product.unit': 'c/u',
      'receipts.detail.close': 'Cerrar',
      
      // Analytics
      'analytics.description': 'Analiza tus patrones de gasto y encuentra oportunidades de ahorro',
      
      // Analytics Filters
      'analytics.filters.period': 'Período:',
      'analytics.filters.period.year': 'Año',
      'analytics.filters.period.month': 'Mes',
      'analytics.filters.period.week': 'Semana',
      'analytics.filters.year': 'Año:',
      'analytics.filters.month': 'Mes:',
      'analytics.filters.allMonths': 'Todos los meses',
      'analytics.filters.january': 'Enero',
      'analytics.filters.february': 'Febrero',
      'analytics.filters.march': 'Marzo',
      'analytics.filters.april': 'Abril',
      'analytics.filters.may': 'Mayo',
      'analytics.filters.june': 'Junio',
      'analytics.filters.july': 'Julio',
      'analytics.filters.august': 'Agosto',
      'analytics.filters.september': 'Septiembre',
      'analytics.filters.october': 'Octubre',
      'analytics.filters.november': 'Noviembre',
      'analytics.filters.december': 'Diciembre',
      
      // Analytics Stats Cards
      'analytics.stats.totalSpent': 'Total Gastado',
      'analytics.stats.receiptsAnalyzed': 'Recibos Analizados',
      'analytics.stats.productsPurchased': 'Productos Comprados',
      'analytics.stats.avgPerReceipt': 'Promedio por Recibo',
      'analytics.stats.supermarketsVisited': 'Supermercados Visitados',
      'analytics.stats.daysAnalyzed': 'Días Analizados',
      
      // Analytics Loading & No Data
      'analytics.loading.general': 'Cargando datos generales...',
      'analytics.loading.monthly': 'Cargando gráfico mensual...',
      'analytics.loading.supermarkets': 'Cargando gráfico de supermercados...',
      'analytics.loading.trends': 'Cargando tendencias de precio...',
      'analytics.loading.savings': 'Cargando análisis de ahorros...',
      'analytics.noData.title': 'No hay datos disponibles',
      'analytics.noData.message': 'Aún no hay recibos analizados para mostrar estadísticas. Sube algunos recibos primero.',
      'analytics.noData.monthly': 'No hay datos mensuales disponibles',
      'analytics.noData.supermarkets': 'No hay datos de supermercados disponibles',
      'analytics.noData.trends': 'No hay datos de tendencias disponibles',
      'analytics.noData.savings': 'No hay datos de ahorros disponibles',
      
      // Analytics Charts
      'analytics.charts.monthlyComparison': 'Comparación Mensual',
      'analytics.charts.monthlyComparison.title': 'Comparación Mensual',
      'analytics.charts.bestMonth': 'Mejor mes:',
      'analytics.charts.supermarketDistribution': 'Distribución por Supermercado',
      'analytics.charts.supermarketDistribution.title': 'Gasto por Supermercado',
      'analytics.charts.priceTrends': 'Tendencias de Precio - Top 3 Productos',
      'analytics.charts.savingsPotential': 'Potencial de Ahorro por Producto',
      'analytics.charts.savingsPotential.title': 'Top 5 Productos con Mayor Ahorro Potencial',
      'analytics.charts.totalSpentLabel': 'Gasto Total (€)',
      'analytics.charts.priceLabel': 'Precio (€)',
      'analytics.charts.purchaseHistory': 'Historial de compras',
      'analytics.charts.purchaseNumber': 'Compra',
      'analytics.charts.savingsPotentialLabel': 'Ahorro Potencial (€)',
      
      // Analytics Insights
      'analytics.insights.topProducts': 'Top 3 Productos Más Comprados',
      'analytics.insights.totalSpent': 'Total gastado:',
      'analytics.insights.totalQuantity': 'Cantidad total:',
      'analytics.insights.avgPrice': 'Precio promedio:',
      'analytics.insights.savingsAnalysis': 'Análisis de Ahorros entre Supermercados',
      'analytics.insights.cheapestAt': 'Más barato en:',
      'analytics.insights.expensiveAt': 'Más caro en:',
      'analytics.insights.savingPercentage': 'ahorro',
      'analytics.insights.totalPotentialSaving': 'Ahorro total potencial:',
      
      // Analytics Period Info
      'analytics.period.title': 'Período de Análisis',
      'analytics.period.firstReceipt': 'Primer recibo:',
      'analytics.period.lastReceipt': 'Último recibo:',
      
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
      'receipts.title': 'Receipts',
      'receipts.description': 'Manage and analyze your grocery receipts',
      'receipts.upload.click': 'Click to upload',
      'receipts.upload.dragdrop': 'or drag and drop',
      'receipts.upload.format': 'Grocery receipt PDF (MAX. 10MB)',
      'receipts.file.selected': 'Selected file',
      'receipts.file.remove': 'Remove file',
      'receipts.upload.process': 'Process Receipt',
      'receipts.upload.processing': 'Processing receipt...',
      'receipts.list.title': 'Receipt List',
      'receipts.list.empty': 'No receipts',
      'receipts.list.empty.subtitle': 'Upload your first receipt to get started',
      'receipts.error.load': 'Error loading receipts',
      'receipts.retry': 'Retry',
      'receipts.loading': 'Connecting to server...',
      'receipts.loading.update': 'Updating receipts...',
      'receipts.card.total': 'Total',
      'receipts.card.products': 'Products',
      'receipts.card.view': 'View details',
      'receipts.card.delete': 'Delete',
      'receipts.detail.title': 'Receipt Details',
      'receipts.detail.loading': 'Loading details...',
      'receipts.detail.supermarket': 'Supermarket:',
      'receipts.detail.date': 'Date:',
      'receipts.detail.total': 'Total:',
      'receipts.detail.products': 'Products:',
      'receipts.detail.items': 'items',
      'receipts.detail.products.list': 'Product List',
      'receipts.detail.product.quantity': 'Quantity:',
      'receipts.detail.product.unit': 'each',
      'receipts.detail.close': 'Close',
      
      // Analytics
      'analytics.description': 'Analyze your spending patterns and find saving opportunities',
      
      // Analytics Filters
      'analytics.filters.period': 'Period:',
      'analytics.filters.period.year': 'Year',
      'analytics.filters.period.month': 'Month',
      'analytics.filters.period.week': 'Week',
      'analytics.filters.year': 'Year:',
      'analytics.filters.month': 'Month:',
      'analytics.filters.allMonths': 'All months',
      'analytics.filters.january': 'January',
      'analytics.filters.february': 'February',
      'analytics.filters.march': 'March',
      'analytics.filters.april': 'April',
      'analytics.filters.may': 'May',
      'analytics.filters.june': 'June',
      'analytics.filters.july': 'July',
      'analytics.filters.august': 'August',
      'analytics.filters.september': 'September',
      'analytics.filters.october': 'October',
      'analytics.filters.november': 'November',
      'analytics.filters.december': 'December',
      
      // Analytics Stats Cards
      'analytics.stats.totalSpent': 'Total Spent',
      'analytics.stats.receiptsAnalyzed': 'Receipts Analyzed',
      'analytics.stats.productsPurchased': 'Products Purchased',
      'analytics.stats.avgPerReceipt': 'Average per Receipt',
      'analytics.stats.supermarketsVisited': 'Supermarkets Visited',
      'analytics.stats.daysAnalyzed': 'Days Analyzed',
      
      // Analytics Loading & No Data
      'analytics.loading.general': 'Loading general data...',
      'analytics.loading.monthly': 'Loading monthly chart...',
      'analytics.loading.supermarkets': 'Loading supermarkets chart...',
      'analytics.loading.trends': 'Loading price trends...',
      'analytics.loading.savings': 'Loading savings analysis...',
      'analytics.noData.title': 'No data available',
      'analytics.noData.message': 'No receipts analyzed yet to show statistics. Upload some receipts first.',
      'analytics.noData.monthly': 'No monthly data available',
      'analytics.noData.supermarkets': 'No supermarket data available',
      'analytics.noData.trends': 'No trend data available',
      'analytics.noData.savings': 'No savings data available',
      
      // Analytics Charts
      'analytics.charts.monthlyComparison': 'Monthly Comparison',
      'analytics.charts.monthlyComparison.title': 'Monthly Comparison',
      'analytics.charts.bestMonth': 'Best month:',
      'analytics.charts.supermarketDistribution': 'Supermarket Distribution',
      'analytics.charts.supermarketDistribution.title': 'Spending by Supermarket',
      'analytics.charts.priceTrends': 'Price Trends - Top 3 Products',
      'analytics.charts.savingsPotential': 'Savings Potential by Product',
      'analytics.charts.savingsPotential.title': 'Top 5 Products with Highest Savings Potential',
      'analytics.charts.totalSpentLabel': 'Total Spent (€)',
      'analytics.charts.priceLabel': 'Price (€)',
      'analytics.charts.purchaseHistory': 'Purchase history',
      'analytics.charts.purchaseNumber': 'Purchase',
      'analytics.charts.savingsPotentialLabel': 'Savings Potential (€)',
      
      // Analytics Insights
      'analytics.insights.topProducts': 'Top 3 Most Purchased Products',
      'analytics.insights.totalSpent': 'Total spent:',
      'analytics.insights.totalQuantity': 'Total quantity:',
      'analytics.insights.avgPrice': 'Average price:',
      'analytics.insights.savingsAnalysis': 'Savings Analysis Between Supermarkets',
      'analytics.insights.cheapestAt': 'Cheapest at:',
      'analytics.insights.expensiveAt': 'Most expensive at:',
      'analytics.insights.savingPercentage': 'savings',
      'analytics.insights.totalPotentialSaving': 'Total potential saving:',
      
      // Analytics Period Info
      'analytics.period.title': 'Analysis Period',
      'analytics.period.firstReceipt': 'First receipt:',
      'analytics.period.lastReceipt': 'Last receipt:',
      
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
