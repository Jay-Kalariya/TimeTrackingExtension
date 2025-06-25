import { Component, OnInit } from '@angular/core';
import { AdminTaskService, Task, TaskAssignmentDto } from '../services/admin-task.service';
import { UserService } from '../services/user.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../modals/user.modals';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admintaskview',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admintaskview.component.html',
  styleUrls: ['./admintaskview.component.css']
})
export class AdmintaskviewComponent implements OnInit {
  tasks: (Task & { assignedUsers: User[] })[] = [];
  users: User[] = [];
  taskForm: FormGroup;
  editingTaskId: number | null = null;
  isLoading = true;

  constructor(
    private taskService: AdminTaskService,
    private userService: UserService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.taskForm = this.fb.group({
      name: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loadTasks();
      },
      error: (err) => {
        this.toastr.error('Failed to load users', 'Error');
        this.isLoading = false;
      }
    });
  }

  loadTasks(): void {
    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks.filter(task =>
          !task.isProtected &&
          !['break', 'lunch', 'day off'].includes(task.name.toLowerCase())
        ).map(task => ({
          ...task,
          assignedUsers: []
        }));
        this.loadAssignments();
      },
      error: () => {
        this.toastr.error('Failed to load tasks', 'Error');
        this.isLoading = false;
      }
    });
  }

  loadAssignments(): void {
    this.taskService.getAllAssignments().subscribe({
      next: (assignments) => {
        assignments.forEach(assignment => {
          const task = this.tasks.find(t => t.id === assignment.taskId);
          const user = this.users.find(u => u.id === assignment.userId);

          if (task && user && !task.assignedUsers.some(u => u.id === user.id)) {
            task.assignedUsers.push(user);
          }
        });
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load assignments', 'Error');
        this.isLoading = false;
      }
    });
  }

  editTask(task: Task): void {
    this.editingTaskId = task.id;
    this.taskForm.patchValue({ name: task.name || '' });
  }

  updateTask(): void {
    if (this.editingTaskId !== null) {
      const { name } = this.taskForm.getRawValue();
      if (!name || !name.trim()) {
        this.toastr.warning("Task name can't be empty", 'Validation');
        return;
      }

      const updatedTask: Task = {
        id: this.editingTaskId,
        name
      };

      this.taskService.updateTask(this.editingTaskId, updatedTask).subscribe({
        next: () => {
          this.toastr.success('Task updated successfully', 'Success');
          this.loadTasks();
          this.cancelEdit();
        },
        error: () => {
          this.toastr.error('Failed to update task', 'Error');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingTaskId = null;
    this.taskForm.reset();
  }

  deleteTask(taskId: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.toastr.success('Task deleted successfully', 'Success');
          this.loadTasks();
        },
        error: () => {
          this.toastr.error('Failed to delete task', 'Error');
        }
      });
    }
  }

  onUserSelect(event: Event, taskId: number): void {
    const userId = Number((event.target as HTMLSelectElement).value);
    if (!isNaN(userId)) {
      this.taskService.assignTask({ taskId, userId }).subscribe({
        next: () => {
          this.toastr.success('User assigned to task', 'Success');
          this.loadAssignments();
          (event.target as HTMLSelectElement).value = '';
        },
        error: () => {
          this.toastr.error('Failed to assign task', 'Error');
        }
      });
    }
  }

  unassignTask(taskId: number, userId: number): void {
    this.taskService.unassignTask(taskId, userId).subscribe({
      next: () => {
        this.toastr.success('User unassigned from task', 'Success');
        this.loadAssignments();
      },
      error: () => {
        this.toastr.error('Failed to unassign task', 'Error');
      }
    });
  }
}
