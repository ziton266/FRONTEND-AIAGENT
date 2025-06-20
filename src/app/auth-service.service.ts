import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  username?: string;
  sessionId?: string;
  sessionTimeout?: number;
}

export interface AuthStatus {
  authenticated: boolean;
  username?: string;
  sessionId?: string;
  sessionTimeoutRemaining?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:9099/api/jira'; 
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<string>('');
  
  public authStatus$ = this.authStatusSubject.asObservable();
  public user$ = this.userSubject.asObservable();
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true // Important for session cookies
  };

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const loginData: LoginRequest = { username, password };
    
    try {
      const response = await this.http.post<LoginResponse>(
        `${this.apiUrl}/login`,
        loginData,
        this.httpOptions
      ).toPromise();
      
      if (response && response.success) {
        this.authStatusSubject.next(true);
        this.userSubject.next(response.username || '');
      }
      
      return response || { success: false, message: 'Aucune réponse du serveur' };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Gestion spécifique des erreurs HTTP
      if (error instanceof HttpErrorResponse) {
        // Si le backend renvoie une structure JSON avec success et message
        if (error.error && typeof error.error === 'object') {
          return {
            success: false,
            message: error.error.message || 'Erreur d\'authentification'
          };
        }
        
        // Gestion par code de statut HTTP
        switch (error.status) {
          case 400:
            return {
              success: false,
              message: error.error?.message || 'Données invalides'
            };
          case 401:
            return {
              success: false,
              message: error.error?.message || 'Identifiants incorrects'
            };
          case 500:
            return {
              success: false,
              message: error.error?.message || 'Erreur interne du serveur'
            };
          case 0:
            return {
              success: false,
              message: 'Impossible de contacter le serveur'
            };
          default:
            return {
              success: false,
              message: error.error?.message || `Erreur HTTP ${error.status}`
            };
        }
      }
      
      // Erreur réseau ou autre
      return {
        success: false,
        message: 'Erreur de connexion réseau'
      };
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.http.post<{ success: boolean; message: string }>(
        `${this.apiUrl}/logout`,
        {},
        this.httpOptions
      ).toPromise();
      
      if (response && response.success) {
        this.authStatusSubject.next(false);
        this.userSubject.next('');
      }
      
      return response || { success: false, message: 'Aucune réponse du serveur' };
    } catch (error: any) {
      console.error('Logout error:', error);
      
      if (error instanceof HttpErrorResponse && error.error?.message) {
        return {
          success: false,
          message: error.error.message
        };
      }
      
      return {
        success: false,
        message: 'Erreur lors de la déconnexion'
      };
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await this.http.get<AuthStatus>(
        `${this.apiUrl}/auth/status`,
        this.httpOptions
      ).toPromise();
      
      if (response) {
        this.authStatusSubject.next(response.authenticated);
        this.userSubject.next(response.username || '');
        return response.authenticated;
      }
      
      return false;
    } catch (error) {
      console.error('Auth status check error:', error);
      this.authStatusSubject.next(false);
      this.userSubject.next('');
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.authStatusSubject.value;
  }

  getCurrentUser(): string {
    return this.userSubject.value;
  }
}