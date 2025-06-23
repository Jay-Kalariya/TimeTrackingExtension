declare var chrome: any;

import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
    standalone: true,
  imports : [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Check if token is in chrome storage when the app loads
    chrome.storage.local.get(['token'], (result:any) => {
      if (result.token) {
        // Set the token in the auth service or local storage
        this.authService.setToken(result.token);

        const role = this.authService.getRole();
        if (role === 'Admin') {
          this.router.navigate(['/admindashboard']);
        } else {
          this.router.navigate(['/userdashboard']);
        }
      } else {
        // No token found, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }

  isLoggedIn(): boolean {
  return !!this.authService.getToken();
}

    logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirect to login
  }
}
