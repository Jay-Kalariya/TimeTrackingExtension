import { Component, OnInit } from '@angular/core';
import { ProjectService, Project } from '../services/project.service';
import { TaskService, Task } from '../services/task.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

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
  selectedTaskId: number | null = null;
  selectedProjectIdForAssignment: number | null = null;

   showEditModal: boolean = false;
  editedProjectId: number | null = null;
  editedProjectName: string = '';

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  loadProjects() {
    this.projectService.getAllProjects().subscribe({
      next: (data) => this.projects = data,
      error: () => this.toastr.error('❌ Failed to load projects', 'Error')
    });
  }

loadTasks() {
  this.taskService.getAllTasks().subscribe({
    next: (res) => {
      // Convert name to lowercase and trim whitespace to match exactly
      this.tasks = res.filter(task => {
        const name = task.name.toLowerCase().trim();
        return !['lunch', 'break', 'day off'].includes(name);
      });
      console.log('Filtered tasks:', this.tasks.map(t => t.name)); // Debug
    },
    error: () => this.toastr.error('❌ Failed to load tasks', 'Error')
  });
}

  assignTaskToProject() {
    if (!this.selectedTaskId || !this.selectedProjectIdForAssignment) {
      this.toastr.warning('Please select both task and project', 'Validation');
      return;
    }

    this.projectService.assignTask(this.selectedTaskId, this.selectedProjectIdForAssignment).subscribe({
      next: () => {
        this.toastr.success('✅ Task assigned!', 'Success');
        this.loadProjects();
      },
      error: () => this.toastr.error('❌ Task assignment failed', 'Error')
    });
  }

  deleteProject(id: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.toastr.success('✅ Project deleted!', 'Success');
          this.loadProjects();
        },
        error: () => this.toastr.error('❌ Delete failed', 'Error')
      });
    }
  }


    openModal(project: Project) {
    this.editedProjectId = project.id!;
    this.editedProjectName = project.name;
    this.showEditModal = true;
  }

  closeModal() {
    this.editedProjectId = null;
    this.editedProjectName = '';
    this.showEditModal = false;
  }

  saveEdit() {
    if (!this.editedProjectName.trim()) {
      this.toastr.warning('Project name cannot be empty');
      return;
    }

    const updatedProject: Project = { name: this.editedProjectName };
    this.projectService.updateProject(this.editedProjectId!, updatedProject).subscribe({
      next: () => {
        this.toastr.success('✅ Project updated!', 'Success');
        this.loadProjects();
        this.closeModal();
      },
      error: () => this.toastr.error('❌ Update failed', 'Error')
    });
  }
}
