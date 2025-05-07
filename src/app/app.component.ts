import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './services/chat.service';

interface Message {
  text: string;
  sent: boolean; // true si envoyé par l'utilisateur, false si reçu
  timestamp: Date;
  isFile?: boolean;
  fileName?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  messages: Message[] = [];
  newMessage = '';
  showChat = false;
  isLoading = false;
  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    // Messages de démonstration initiaux si nécessaire
    this.messages = [];
  }

  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
      // Ajout du message de l'utilisateur à la conversation
      const userMessage: Message = {
        text: this.newMessage,
        sent: true,
        timestamp: new Date()
      };

      // Si un fichier est sélectionné, ajoutez les informations du fichier
      if (this.selectedFile) {
        userMessage.isFile = true;
        userMessage.fileName = this.selectedFile.name;
        userMessage.text = this.newMessage || `J'ai une question sur ce fichier: ${this.selectedFile.name}`;
      }

      this.messages.push(userMessage);

      // Mémoriser les valeurs avant de les réinitialiser
      const question = this.newMessage;
      const file = this.selectedFile;

      // Réinitialiser les champs
      this.newMessage = '';
      this.selectedFile = null;
      this.isLoading = true;

      // Afficher un message de chargement
      this.messages.push({
        text: 'En train de réfléchir...',
        sent: false,
        timestamp: new Date()
      });

      // Appeler le service approprié selon la présence d'un fichier
      if (file) {
        this.chatService.uploadPdfAndAskQuestion(file, question).subscribe({
          next: (response) => {
            this.handleResponse(response);
          },
          error: (error) => {
            this.handleError(error);
          }
        });
      } else {
        this.chatService.askQuestion(question).subscribe({
          next: (response) => {
            this.handleResponse(response);
          },
          error: (error) => {
            this.handleError(error);
          }
        });
      }
    }
  }

  private handleResponse(response: string): void {
    // Supprimer le message de chargement
    this.messages.pop();
    this.isLoading = false;

    // Ajouter la réponse de l'API
    this.messages.push({
      text: response,
      sent: false,
      timestamp: new Date()
    });
  }

  private handleError(error: any): void {
    // Supprimer le message de chargement
    this.messages.pop();
    this.isLoading = false;

    // Ajouter un message d'erreur
    this.messages.push({
      text: `Erreur: ${error.message || 'Une erreur est survenue lors de la communication avec le serveur.'}`,
      sent: false,
      timestamp: new Date()
    });
  }

  toggleChat(): void {
    this.showChat = !this.showChat;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
