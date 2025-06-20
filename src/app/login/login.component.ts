import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth-service.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';
  showAlert: boolean = false;
  returnUrl: string = '/chat';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Formulaire avec validation des champs obligatoires uniquement
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(1)]],
      password: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour depuis les paramètres de requête
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/chat';
    this.checkAuthStatus();
  }

  async checkAuthStatus(): Promise<void> {
    try {
      const isAuthenticated = await this.authService.checkAuthStatus();
      if (isAuthenticated) {
        this.router.navigate([this.returnUrl]);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    }
  }

  async onSubmit(): Promise<void> {
    // Validation des champs obligatoires
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.showAlertMessage('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    this.hideAlert();

    const { username, password } = this.loginForm.value;

    try {
      console.log('Tentative de connexion pour:', username); // Debug
      
      const response = await this.authService.login(username.trim(), password.trim());
      
      console.log('Réponse du service:', response); // Debug
      
      if (response.success) {
        // Message de succès du backend
        this.showAlertMessage('success', response.message || 'Connexion réussie!');
        
        // Redirection après succès
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1500);
      } else {
        // Message d'erreur du backend (authentification incorrecte)
        this.showAlertMessage('error', response.message || 'Identifiants incorrects');
      }
    } catch (error) {
      console.error('Login error dans le composant:', error);
      // Message d'erreur générique pour les erreurs non gérées
      this.showAlertMessage('error', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      this.isLoading = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showAlertMessage(type: 'success' | 'error', message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.showAlert = true;
    
    // Auto-hide après 5 secondes pour les messages de succès
    if (type === 'success') {
      setTimeout(() => {
        this.hideAlert();
      }, 5000);
    }
  }

  public hideAlert(): void {
    this.showAlert = false;
    this.alertMessage = '';
  }

  // Getters pour accéder facilement aux contrôles du formulaire dans le template
  get username() { 
    return this.loginForm.get('username'); 
  }
  
  get password() { 
    return this.loginForm.get('password'); 
  }

  // Vérifier si un champ a une erreur et a été touché
  hasError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Obtenir le message d'erreur spécifique pour un champ
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'username' ? 'Le nom d\'utilisateur' : 'Le mot de passe'} est requis`;
      }
      if (field.errors['minlength']) {
        return `${fieldName === 'username' ? 'Le nom d\'utilisateur' : 'Le mot de passe'} ne peut pas être vide`;
      }
    }
    return '';
  }
}