import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {User} from '../modals/user.modals'

@Injectable({ providedIn: 'root' })
export class UserService {
private apiUrl: string;

constructor(private http: HttpClient) {
  const isLocal = window.location.hostname === 'localhost';
  const rootUrl = isLocal
    ? 'http://localhost:5236'
    : 'https://timetrackingextension-3.onrender.com';
  this.apiUrl = `${rootUrl}/api/User`;
}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }
}
