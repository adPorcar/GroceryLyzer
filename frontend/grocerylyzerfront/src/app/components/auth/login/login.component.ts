import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe'
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-login',
    imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'] 
})
export class LoginComponent {
    user = {
        username: '',
        password: ''
    };
    rememberMe = false;
    isLoading = false;
    errorMessage = '';
    successMessage = '';
    showSuccessModal = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    onSubmit() {
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.authService.login(this.user.username, this.user.password).subscribe({
            next: (response: unknown) => {
                console.log('Login exitoso:', response);
                this.isLoading = false;
                this.showSuccessModal = true;
                setTimeout(() => {
                    this.showSuccessModal = false;
                    this.router.navigate(['/home']);
                }, 3000);
            }, 
            error: (error: any) => {
                console.error('Error en el login:', error);
                this.isLoading = false;
                this.errorMessage = error.error?.message || 'Credenciales incorrectas. Por favor, inténtalo de nuevo.';
            }
        });
    }
}