declare var chrome: any;

import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    chrome.storage.local.get(['token'], (result: any) => {
      if (result.token) {
        this.authService.setToken(result.token);
        const role = this.authService.getRole();

        if (role === 'Admin') {
          this.router.navigate(['/admindashboard']);
          this.toastr.success('Welcome back Admin!');
        } else {
          this.router.navigate(['/userdashboard']);
          this.toastr.success('Welcome back!');
        }
      } else {
        this.toastr.info('Please login to continue.');
        this.router.navigate(['/login']);
      }
    });
  }

  isLoggedIn(): boolean {
    return !!this.authService.getToken();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.toastr.success('You have been logged out.');
  }
}
