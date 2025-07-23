import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService, UpdateProfileRequest, ChangePasswordRequest } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  // Datos del perfil
  profileData = {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    birth_date: '',
    email_notifications: true,
    price_alerts: true
  };

  // Datos para cambio de contraseña
  passwordData = {
    old_password: '',
    new_password: '',
    confirm_password: ''
  };

  // Estados de la UI
  isLoadingProfile = false;
  isLoadingPassword = false;
  profileMessage = '';
  passwordMessage = '';
  profileError = '';
  passwordError = '';
  showSuccessModal = false;
  showPasswordForm = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar si el usuario está logueado antes de cargar el perfil
    console.log('ProfileComponent: ngOnInit - checking authentication');
    console.log('isLoggedIn:', this.authService.isLoggedIn());
    console.log('currentUser:', this.authService.getCurrentUser());
    
    if (!this.authService.isLoggedIn()) {
      console.log('Usuario no está logueado, redirigiendo al login');
      this.router.navigate(['/login']);
      return;
    }
    this.loadProfile();
  }

  loadProfile() {
    console.log('ProfileComponent: loadProfile - starting request');
    this.isLoadingProfile = true;
    this.profileError = '';
    
    // Timeout de seguridad
    const loadTimeout = setTimeout(() => {
      console.log('ProfileComponent: loadProfile timeout - forcing stop');
      this.isLoadingProfile = false;
      this.profileError = 'Tiempo de espera agotado. Inicia sesión de nuevo.';
      this.authService.forceLogout();
      this.router.navigate(['/login']);
    }, 3000); // 10 segundos timeout
    
    this.authService.getProfile().subscribe({
      next: (response) => {
        clearTimeout(loadTimeout);
        console.log('ProfileComponent: loadProfile success', response);
        if (response.success) {
          this.profileData = {
            first_name: response.user.first_name || '',
            last_name: response.user.last_name || '',
            email: response.user.email || '',
            phone_number: response.profile.phone_number || '',
            birth_date: response.profile.birth_date || '',
            email_notifications: response.profile.email_notifications,
            price_alerts: response.profile.price_alerts
          };
        }
        this.isLoadingProfile = false;
      },
      error: (error) => {
        clearTimeout(loadTimeout);
        console.error('ProfileComponent: loadProfile error', error);
        if (error.status === 401) {
          // Si es 401, el usuario no está autenticado
          console.log('Usuario no autenticado, limpiando sesión y redirigiendo');
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        } else {
          this.profileError = `Error al cargar el perfil: ${error.status} ${error.statusText}`;
        }
        this.isLoadingProfile = false;
      }
    });
  }

  onUpdateProfile() {
    this.isLoadingProfile = true;
    this.profileError = '';
    this.profileMessage = '';

    const updateData: UpdateProfileRequest = {
      first_name: this.profileData.first_name,
      last_name: this.profileData.last_name,
      email: this.profileData.email,
      phone_number: this.profileData.phone_number,
      birth_date: this.profileData.birth_date || undefined,
      email_notifications: this.profileData.email_notifications,
      price_alerts: this.profileData.price_alerts
    };

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.profileMessage = response.message;
          this.showSuccessModal = true;
          setTimeout(() => {
            this.showSuccessModal = false;
          }, 3000);
        }
        this.isLoadingProfile = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        if (error.status === 401) {
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        } else {
          this.profileError = error.error?.error || 'Error al actualizar el perfil';
        }
        this.isLoadingProfile = false;
      }
    });
  }

  onChangePassword() {
    if (this.passwordData.new_password !== this.passwordData.confirm_password) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }

    if (this.passwordData.new_password.length < 8) {
      this.passwordError = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    this.isLoadingPassword = true;
    this.passwordError = '';
    this.passwordMessage = '';

    const passwordChangeData: ChangePasswordRequest = {
      old_password: this.passwordData.old_password,
      new_password: this.passwordData.new_password,
      confirm_password: this.passwordData.confirm_password
    };

    this.authService.changePassword(passwordChangeData).subscribe({
      next: (response) => {
        this.passwordMessage = 'Contraseña cambiada exitosamente';
        this.passwordData = {
          old_password: '',
          new_password: '',
          confirm_password: ''
        };
        this.showPasswordForm = false;
        this.isLoadingPassword = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        if (error.status === 401) {
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        } else {
          this.passwordError = error.error?.error || 'Error al cambiar la contraseña';
        }
        this.isLoadingPassword = false;
      }
    });
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    this.passwordError = '';
    this.passwordMessage = '';
    this.passwordData = {
      old_password: '',
      new_password: '',
      confirm_password: ''
    };
  }
}
