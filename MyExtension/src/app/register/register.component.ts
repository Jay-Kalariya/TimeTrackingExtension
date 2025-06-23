import { Component } from '@angular/core';
import { ApiService } from '../api.service';  // Import your API service
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports:[FormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerData = {
    username: '',
    email: '',
    password: ''
  };
  errorMessage = '';
  successMessage = '';

  constructor(private apiService: ApiService, private router: Router) {}

  onRegister(): void {
    this.apiService.register(this.registerData).subscribe(
      (response) => {
        console.log('Registration successful!', response);
        this.successMessage = 'Registration successful! You can now login.';
        this.registerData = { username: '', email: '', password: '' };  // Clear form
      },
      (error) => {
        this.errorMessage = 'Registration failed, please try again!';
        console.error('Registration failed', error);
      }
    );
  }
}
