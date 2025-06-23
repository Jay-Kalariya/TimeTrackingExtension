declare var chrome: any;

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = { email: '', password: '' };
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.storage?.local;

    if (isChromeExtension) {
      chrome.storage.local.get(['token'], (result: any) => {
        const token = result.token;
        if (token) {
          this.auth.setToken(token);
          const role = this.auth.getRole();
          this.redirectBasedOnRole(role);
        }
      });
    } else {
      const token = this.auth.getToken();
      if (token) {
        const role = this.auth.getRole();
        this.redirectBasedOnRole(role);
      }
    }
  }

  login() {
    this.auth.login(this.credentials).subscribe({
      next: (res: any) => {
        this.auth.setToken(res.token);
        const role = this.auth.getRole();
        this.redirectBasedOnRole(role);
      },
      error: () => {
        this.errorMessage = 'Invalid email or password';
      }
    });
  }

  redirectBasedOnRole(role: string | null) {
    if (role === 'Admin') {
      this.router.navigate(['/admindashboard'], { replaceUrl: true });
    } else if (role) {
      this.router.navigate(['/userdashboard'], { replaceUrl: true });
    }
  }
}
