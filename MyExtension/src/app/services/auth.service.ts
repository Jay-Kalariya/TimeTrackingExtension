import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl :string;
  private tokenKey = 'token';

  constructor(private http: HttpClient) {
    const isLocal = window.location.hostname === 'localhost';
    const baseUrl = isLocal
      ? 'http://localhost:5236'
      : 'https://timetrackingextension-3.onrender.com';
    this.apiUrl = `${baseUrl}/api/Auth`;
  }


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
