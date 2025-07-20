import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  showLoginRequiredModal = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    // Detectar si se llegó aquí por el guard de autenticación
    this.activatedRoute.fragment.subscribe(fragment => {
      if (fragment === 'login-required') {
        this.showLoginRequiredModal = true;
        // Limpiar el fragmento de la URL
        this.router.navigate(['/'], { fragment: undefined });
      }
    });
  }

  closeModal() {
    this.showLoginRequiredModal = false;
  }

  goToLogin() {
    this.showLoginRequiredModal = false;
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.showLoginRequiredModal = false;
    this.router.navigate(['/register']);
  }
}
