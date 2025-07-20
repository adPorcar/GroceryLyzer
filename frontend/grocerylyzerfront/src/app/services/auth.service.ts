import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  };
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

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/`, userData);
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, { 
      username: username,
      password 
    }).pipe(
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
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/logout/`, {}).pipe(
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
}
