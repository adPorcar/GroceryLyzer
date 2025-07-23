import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    // Redirigir al home con un fragmento que indique que necesita iniciar sesión
    router.navigate(['/'], { fragment: 'login-required' });
    return false;
  }
};
