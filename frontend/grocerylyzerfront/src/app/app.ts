import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'grocerylyzerfront';
  sidebarOpen = false;

  constructor(public translationService: TranslationService) {}

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
}
