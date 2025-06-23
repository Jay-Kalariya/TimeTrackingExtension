import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {User} from '../modals/user.modals'

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:5236/api/User'; // adjust if needed

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }
}
