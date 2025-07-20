import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  user = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showSuccessModal = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Preparar datos para el backend
    const registerData = {
      username: this.user.email, // Usamos email como username
      email: this.user.email,
      password1: this.user.password,
      password2: this.user.confirmPassword,
      first_name: this.user.name
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.isLoading = false;
        this.showSuccessModal = true;
        // Redirigir al home después de mostrar el modal
        setTimeout(() => {
          this.showSuccessModal = false;
          this.router.navigate(['/home']);
        }, 3000);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.errorMessage = error.error?.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }
}
