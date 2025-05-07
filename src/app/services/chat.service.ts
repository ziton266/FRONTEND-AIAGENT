import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Service pour interagir avec le backend de chat alimenté par RAG
 * Gère les discussions générales, les requêtes spécifiques à JIRA et le téléchargement de documents
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:9099';
  
  constructor(private http: HttpClient) { }
  
  /**
   * Envoie une question générale au backend de chat
   * Le backend détectera automatiquement s'il s'agit d'une question liée à JIRA
   * @param question La question de l'utilisateur
   * @returns Observable avec la réponse textuelle
   */
  askQuestion(question: string): Observable<string> {
    const params = new HttpParams().set('question', question);
    return this.http.get(`${this.baseUrl}/`, { params, responseType: 'text' });
  }
  
  /**
   * Envoie une question spécifiquement à l'endpoint JIRA
   * À utiliser quand vous savez que la question est liée à JIRA
   * @param question La question liée à JIRA
   * @returns Observable avec la réponse textuelle
   */
  askJiraQuestion(question: string): Observable<string> {
    const params = new HttpParams().set('question', question);
    return this.http.get(`${this.baseUrl}/jira`, { params, responseType: 'text' });
  }
  
  /**
   * Télécharge un document PDF et pose une question à son sujet
   * @param file Le fichier PDF à télécharger
   * @param question La question concernant le contenu du PDF
   * @returns Observable avec la réponse textuelle
   */
  uploadPdfAndAskQuestion(file: File, question: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);
    return this.http.post(`${this.baseUrl}/upload`, formData, { responseType: 'text' });
  }
  
  /**
   * Détecte si une requête est probablement liée à JIRA en fonction de mots-clés
   * @param query La requête de l'utilisateur
   * @returns boolean indiquant si la requête semble être liée à JIRA
   */
  isJiraQuery(query: string): boolean {
    const normalizedQuery = query.toLowerCase();
    
    // Mots-clés qui indiquent une requête liée à Jira
    const jiraKeywords = [
      'jira', 'ticket', 'issue', 'project', 'version', 'epic', 'sprint', 'story',
      'bug', 'task', 'comment', 'assignee', 'reporter', 'status', 'backlog'
    ];
    
    // Vérification des mots-clés
    for (const keyword of jiraKeywords) {
      if (normalizedQuery.includes(keyword)) {
        return true;
      }
    }
    
    // Vérification du modèle de clé JIRA (ex: ABC-123)
    if (normalizedQuery.match(/[a-zA-Z]+-\d+/)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Gestionnaire intelligent de questions qui route vers l'endpoint approprié
   * basé sur l'analyse du contenu de la requête
   * @param question La question de l'utilisateur
   * @returns Observable avec la réponse textuelle
   */
  smartAskQuestion(question: string): Observable<string> {
    if (this.isJiraQuery(question)) {
      return this.askJiraQuestion(question);
    } else {
      return this.askQuestion(question);
    }
  }
}
