import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, timeout, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

export interface RegisterRequest {
  username: string;
  email: string;
  password1: string;
  password2: string;
  first_name?: string;
}

export interface AuthResponse {
  message: string;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name?: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  profile: {
    phone_number: string;
    birth_date: string | null;
    email_notifications: boolean;
    price_alerts: boolean;
  };
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  birth_date?: string;
  email_notifications?: boolean;
  price_alerts?: boolean;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/users'; // URL del backend Django
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar si hay un usuario guardado en localStorage al inicializar
    // Solo si estamos en el browser
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    }
  }

  // Método para obtener headers con credenciales
  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true // Importante para enviar cookies de sesión
    };
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/`, userData, this.getHttpOptions());
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, { 
      username: username,
      password 
    }, this.getHttpOptions()).pipe(
      tap(response => {
        if (response.user && isPlatformBrowser(this.platformId)) {
          // Guardar usuario en localStorage y actualizar el subject
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): Observable<AuthResponse> {
    console.log('AuthService: logout called');
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/logout/`, {}, this.getHttpOptions()).pipe(
      timeout(5000), // 5 segundos timeout
      tap({
        next: (response) => {
          console.log('AuthService: logout successful', response);
        },
        error: (error) => {
          console.error('AuthService: logout error', error);
        }
      }),
      catchError((error) => {
        console.log('AuthService: logout failed, returning empty response', error);
        return of({ message: 'Local logout completed' } as AuthResponse);
      })
    );
  }

  // Método para forzar logout local
  forceLogout() {
    console.log('AuthService: force logout');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Métodos de perfil
  getProfile(): Observable<ProfileResponse> {
    console.log('AuthService: getProfile called');
    const options = this.getHttpOptions();
    console.log('AuthService: HTTP options', options);
    return this.http.get<ProfileResponse>(`${this.apiUrl}/profile/`, options).pipe(
      tap({
        next: (response) => console.log('AuthService: getProfile success', response),
        error: (error) => console.error('AuthService: getProfile error', error)
      })
    );
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.apiUrl}/profile/update/`, profileData, this.getHttpOptions()).pipe(
      tap(response => {
        if (response.success && response.user) {
          // Actualizar la información del usuario en el estado local
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, ...response.user };
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
            this.currentUserSubject.next(updatedUser);
          }
        }
      })
    );
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/profile/change-password/`, passwordData, this.getHttpOptions());
  }
}
