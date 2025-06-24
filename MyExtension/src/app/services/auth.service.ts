import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

private apiUrl = `${environment.apiBaseUrl}/Auth`;
private tokenKey = 'token';

constructor(private http: HttpClient) {}



  login(credentials: { email: string; password: string }) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, credentials);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [this.tokenKey]: token });
    }
  }

  getToken(): string | null {
    // Only localStorage for sync access
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return (
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        decoded['role'] ||
        decoded['roles'] ||
        null
      );
    } catch {
      return null;
    }
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove(this.tokenKey, () => {
        console.log('Token removed from chrome.storage');
      });
    }
  }
}
