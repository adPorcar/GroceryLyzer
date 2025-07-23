import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslationService } from './services/translation.service';
import { AuthService } from './services/auth.service';
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'grocerylyzerfront';
  sidebarOpen = false;

  constructor(
    public translationService: TranslationService,
    public authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  changeLanguage(lang: string) {
    this.translationService.setLanguage(lang);
  }

  getCurrentLanguage(): string {
    return this.translationService.getCurrentLanguage();
  }

  onLogout() {
    console.log('Logout clicked - starting logout process');
    
    // Primero hacemos logout local inmediatamente para que la UI responda
    this.authService.forceLogout();
    this.closeSidebar();
    this.router.navigate(['/']);
    
    // Luego intentamos notificar al servidor en segundo plano
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Server logout successful:', response);
      },
      error: (error) => {
        console.log('Server logout failed, but local logout already completed:', error);
      }
    });
  }

  onForceLogout() {
    console.log('Force logout - immediate local logout');
    this.authService.forceLogout();
    this.closeSidebar();
    this.router.navigate(['/']);
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? (user.first_name || user.username) : '';
  }
}
