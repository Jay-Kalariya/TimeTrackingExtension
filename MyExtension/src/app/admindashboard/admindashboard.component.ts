import {
  Component,
  NgZone,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminTaskService, Task } from '../services/admin-task.service';
import { ProjectService, Project } from '../services/project.service';
import { environment } from '../../environments/environment.prod';
import { ToastrService } from 'ngx-toastr';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  userForm: FormGroup;
  taskForm: FormGroup;
  projectForm: FormGroup;

  users: User[] = [];
  searchTerm = '';
  editingUserId: number | null = null;
  showUserModal = false;
  showTaskModal = false;
  showProjectModal = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private taskService: AdminTaskService,
    private projectService: ProjectService,
    private ngZone: NgZone,
    private toastr: ToastrService
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      role: ['User', Validators.required],
      newPassword: ['']
    });

    this.taskForm = this.fb.group({
      name: ['', Validators.required]
    });

    this.projectForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.ngZone.run(() => {
      this.fetchUsers();
    });
  }

  fetchUsers(): void {
    this.getAuthHeaders((headers) => {
      this.http.get<User[]>(`${environment.apiBaseUrl}/User`, { headers }).subscribe({
        next: (res) => this.users = res,
        error: (err) => {
          console.error('Error fetching users', err);
          this.toastr.error('Failed to fetch users', 'Error');
        }
      });
    });
  }

  onSubmit(): void {
    const data = this.userForm.value;

    this.getAuthHeaders((headers) => {
      if (this.editingUserId) {
        const updateData = {
          username: data.username,
          email: data.email,
          role: data.role
        };

        this.http.put(`${environment.apiBaseUrl}/User/${this.editingUserId}`, updateData, { headers }).subscribe(() => {
          if (data.newPassword && data.newPassword.trim() !== '') {
            this.http.put(
              `${environment.apiBaseUrl}/User/${this.editingUserId}/password`,
              { newPassword: data.newPassword },
              { headers }
            ).subscribe({
              next: () => {
                this.fetchUsers();
                this.resetForm();
                this.toastr.success('Password updated successfully', 'Success');
              },
              error: (err) => {
                console.error('Error updating password', err);
                this.toastr.error('Failed to update password', 'Error');
              }
            });
          } else {
            this.fetchUsers();
            this.resetForm();
            this.toastr.success('User updated successfully', 'Success');
          }
        }, (err) => {
          console.error('Error updating user', err);
          this.toastr.error('Failed to update user', 'Error');
        });
      } else {
        this.http.post(`${environment.apiBaseUrl}/auth/register`, data, { headers }).subscribe({
          next: () => {
            this.fetchUsers();
            this.resetForm();
            this.toastr.success('User created successfully', 'Success');
          },
          error: (err) => {
            console.error('Error creating user', err);
            this.toastr.error('Failed to create user', 'Error');
          }
        });
      }
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.getAuthHeaders((headers) => {
        this.http.delete(`${environment.apiBaseUrl}/User/${userId}`, { headers }).subscribe({
          next: () => {
            this.fetchUsers();
            this.toastr.success('User deleted successfully', 'Success');
          },
          error: (err) => {
            console.error('Error deleting user', err);
            this.toastr.error('Failed to delete user', 'Error');
          }
        });
      });
    }
  }

  resetForm(): void {
    this.editingUserId = null;
    this.userForm.reset({ role: 'User' });
    this.showUserModal = false;
  }

  openCreateUserModal(): void {
    this.editingUserId = null;
    this.userForm.reset({ role: 'User' });
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.editingUserId = null;
  }

  editUser(user: User): void {
    this.editingUserId = user.id;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      password: '',
      newPassword: '',
      role: user.role
    });
    this.showUserModal = true;
  }

  viewUser(user: User): void {
    this.router.navigate(['/user-details', user.id]);
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(user =>
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }

  openCreateTaskModal(): void {
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
  }

  openCreateProjectModal(): void {
    this.showProjectModal = true;
  }

  closeProjectModal(): void {
    this.showProjectModal = false;
  }

  submitTask(): void {
    const name = this.taskForm.value.name?.trim();
    if (!name) {
      this.toastr.warning('Task name is required', 'Validation');
      return;
    }
    const task: Task = { id: 0, name };

    this.taskService.createTask(task).subscribe({
      next: () => {
        this.toastr.success('✅ Task created!', 'Success');
        this.taskForm.reset();
        this.closeTaskModal();
      },
      error: (err) => {
        console.error('Error creating task', err);
        this.toastr.error('Failed to create task', 'Error');
      }
    });
  }

  submitProject(): void {
    const name = this.projectForm.value.name?.trim();
    if (!name) {
      this.toastr.warning('Project name is required', 'Validation');
      return;
    }
    const project: Project = { name, tasks: [] };

    this.projectService.createProject(project).subscribe({
      next: () => {
        this.toastr.success('✅ Project created!', 'Success');
        this.projectForm.reset();
        this.closeProjectModal();
      },
      error: (err) => {
        console.error('Error creating project', err);
        this.toastr.error('Failed to create project', 'Error');
      }
    });
  }

  goviewtask(): void {
    this.router.navigate(['/admintaskview']);
  }

  goviewproject(): void {
    this.router.navigate(['/project']);
  }

  private getAuthHeaders(callback: (headers: HttpHeaders) => void): void {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['token'], (result) => {
        this.ngZone.run(() => {
          const token = result['token'];
          if (token) {
            const headers = new HttpHeaders({
              'Authorization': `Bearer ${token}`
            });
            callback(headers);
          } else {
            console.error('No token found in chrome.storage');
            this.toastr.error('Authorization token missing', 'Error');
          }
        });
      });
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        callback(headers);
      } else {
        console.error('No token found in localStorage');
        this.toastr.error('Authorization token missing', 'Error');
      }
    }
  }
}
