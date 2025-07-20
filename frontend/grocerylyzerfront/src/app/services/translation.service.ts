import { Injectable } from '@angular/core';
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
      
      // Footer
      'footer.copyright': 'GroceryLyzer - Analiza tus gastos de supermercado',
      'footer.developed': 'Desarrollado por',
      
      // Language
      'language.spanish': 'Español',
      'language.english': 'English'
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
      
      // Footer
      'footer.copyright': 'GroceryLyzer - Analyze your grocery expenses',
      'footer.developed': 'Developed by',
      
      // Language
      'language.spanish': 'Español',
      'language.english': 'English'
    }
  };

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  setLanguage(lang: string): void {
    this.currentLanguage.next(lang);
    localStorage.setItem('preferred-language', lang);
  }

  translate(key: string): string {
    const currentLang = this.getCurrentLanguage();
    return this.translations[currentLang]?.[key] || key;
  }

  constructor() {
    // Load saved language preference
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && this.translations[savedLang]) {
      this.currentLanguage.next(savedLang);
    }
  }
}
