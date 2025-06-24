import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
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
    private ngZone: NgZone // ✅ Add thi
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
 

  // USER CRUD
  fetchUsers(): void {
    this.getAuthHeaders((headers) => {
      this.http.get<User[]>(`${environment.apiBaseUrl}/User`, { headers }).subscribe({
        next: (res) => this.users = res,
        error: (err) => console.error('Error fetching users', err)
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
              },
              error: (err) => console.error('Error updating password', err)
            });
          } else {
            this.fetchUsers();
            this.resetForm();
          }
        });
      } else {
        this.http.post(`${environment.apiBaseUrl}/auth/register`, data, { headers }).subscribe(() => {
          this.fetchUsers();
          this.resetForm();
        });
      }
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.getAuthHeaders((headers) => {
        this.http.delete(`${environment.apiBaseUrl}/User/${userId}`, { headers }).subscribe(() => {
          this.fetchUsers();
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

  // FILTERING
  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(user =>
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }

  // TASK / PROJECT
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
    if (!name) return alert('Task name is required');
    const task: Task = { id: 0, name };

    this.taskService.createTask(task).subscribe(() => {
      alert('✅ Task created!');
      this.taskForm.reset();
      this.closeTaskModal();
    });
  }

  submitProject(): void {
    const name = this.projectForm.value.name?.trim();
    if (!name) return alert('Project name is required');
    const project: Project = { name, tasks: [] };

    this.projectService.createProject(project).subscribe(() => {
      alert('✅ Project created!');
      this.projectForm.reset();
      this.closeProjectModal();
    });
  }

  goviewtask(): void {
    this.router.navigate(['/admintaskview']);
  }

  goviewproject(): void {
    this.router.navigate(['/project']);
  }

  // HEADER AUTH
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
        }
      });
    });
  } else {
    // Fallback for ng serve
    const token = localStorage.getItem('token');
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      callback(headers);
    } else {
      console.error('No token found in localStorage');
    }
  }



  }
}
