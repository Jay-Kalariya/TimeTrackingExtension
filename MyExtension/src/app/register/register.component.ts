import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerData = {
    username: '',
    email: '',
    password: ''
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onRegister(): void {
    this.apiService.register(this.registerData).subscribe({
      next: (response) => {
        this.toastr.success('🎉 Registration successful! You can now login.', 'Success');
        this.registerData = { username: '', email: '', password: '' }; // Reset form
      },
      error: (err) => {
        this.toastr.error('❌ Registration failed. Please try again.', 'Error');
        console.error('Registration failed', err);
      }
    });
  }
}
