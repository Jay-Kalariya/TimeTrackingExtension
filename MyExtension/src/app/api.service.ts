import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:5236';  // URL of your .NET backend

  constructor(private http: HttpClient) { }

  // Helper method to get token from chrome.storage.local
  private getTokenFromStorage(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['token'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result['token'] || null);
        }
      });
    });
  }

  // Create headers with token asynchronously
  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.getTokenFromStorage();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Updated login function that does not need token in headers
  login(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, userData);
  }

  // Register function also doesn't need a token in headers
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Example of a protected route with async token in headers
  async getUserProfile(): Promise<Observable<any>> {
    const headers = await this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/profile`, { headers });
  }
}
