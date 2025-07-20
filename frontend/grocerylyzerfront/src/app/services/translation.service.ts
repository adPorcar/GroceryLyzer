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
      'profile.welcome': 'Bienvenido a tu perfil',
      'profile.form.name': 'Nombre Completo',
      'profile.form.name.placeholder': 'Tu nombre completo',
      'profile.form.email': 'Correo Electrónico',
      'profile.form.email.placeholder': 'tu@email.com',
      'profile.form.phone': 'Teléfono',
      'profile.form.phone.placeholder': 'Tu número de teléfono',
      'profile.form.budget': 'Presupuesto Mensual',
      'profile.form.budget.placeholder': 'Presupuesto en €',
      'profile.form.save': 'Guardar Cambios',
      
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
      'register.subtitle': 'Únete a GroceryLyzer y comienza a gestionar tus gastos',
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
      'register.loginLink': 'Inicia sesión aquí'
    },
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.receipts': 'Receipts',
      'nav.analytics': 'Analytics',
      'nav.profile': 'Profile',
      
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
      'profile.welcome': 'Welcome to your profile',
      'profile.form.name': 'Full Name',
      'profile.form.name.placeholder': 'Your full name',
      'profile.form.email': 'Email Address',
      'profile.form.email.placeholder': 'your@email.com',
      'profile.form.phone': 'Phone Number',
      'profile.form.phone.placeholder': 'Your phone number',
      'profile.form.budget': 'Monthly Budget',
      'profile.form.budget.placeholder': 'Budget in €',
      'profile.form.save': 'Save Changes',
      
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
      'register.subtitle': 'Join GroceryLyzer and start managing your expenses',
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
      'register.loginLink': 'Sign in here'
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
