import { Component, OnInit } from '@angular/core';
import { ProjectService, Project } from '../services/project.service';
import { TaskService, Task } from '../services/task.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectComponent implements OnInit {
  projects: Project[] = [];
  tasks: Task[] = [];
  message = '';
  error = '';
  selectedTaskId: number | null = null;
  selectedProjectIdForAssignment: number | null = null;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  loadProjects() {
    this.projectService.getAllProjects().subscribe({
      next: (data) => this.projects = data,
      error: () => this.error = '❌ Failed to load projects'
    });
  }

  loadTasks() {
    this.taskService.getAllTasks().subscribe({
      next: (res) => this.tasks = res,
      error: () => this.error = '❌ Failed to load tasks'
    });
  }

  assignTaskToProject() {
    if (!this.selectedTaskId || !this.selectedProjectIdForAssignment) return;
    this.projectService.assignTask(this.selectedTaskId, this.selectedProjectIdForAssignment).subscribe({
      next: () => {
        this.message = '✅ Task assigned!';
        this.loadProjects();
      },
      error: () => this.error = '❌ Task assignment failed'
    });
  }

  deleteProject(id: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.message = '✅ Project deleted!';
          this.loadProjects();
        },
        error: () => this.error = '❌ Delete failed'
      });
    }
  }
}
