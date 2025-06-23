import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../services/task.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './userdeshbaord.component.html',
  styleUrls: ['./userdeshbaord.component.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  tasks: { id: number; name: string }[] = [];
  selectedTask: { id: number; name: string } | null = null;
  timer: any;
  seconds = 0;
  isPaused = false;
  isLoggedIn = false;
  currentISTTime: string = '';
  resumeSeconds = 0;
  showStartButton = false;
  nonWorkingPeriodActive = false;
  

  constructor(private taskService: TaskService, private router: Router) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
     this.loadDashboardTasks(); 
    this.updateCurrentISTTime();
    setInterval(() => this.updateCurrentISTTime(), 1000);
  }

 loadDashboardTasks() {
    this.taskService.getTasksForDashboard().subscribe({
      next: (res) => {
        this.tasks = res;
        console.log('Loaded tasks:', this.tasks); // Debug log
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        alert('Failed to load tasks');
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  updateCurrentISTTime() {
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(nowUTC.getTime() + istOffset);
    this.currentISTTime = istTime.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  }

  selectTask(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newTaskId = +target.value;
    const newTask = this.tasks.find(t => t.id === newTaskId) || null;

    if (this.nonWorkingPeriodActive && newTask && !['Lunch', 'Break', 'Day Off'].includes(newTask.name)) {
      alert('You cannot start a working task while on a break or day off.');
      setTimeout(() => {
        target.value = this.selectedTask?.id.toString() ?? '';
      });
      return;
    }

    if (this.selectedTask && this.selectedTask.id !== newTaskId) {
      this.taskService.endTask().subscribe({
        next: () => this.startNewTask(newTask),
        error: () => alert('Failed to end current task.')
      });
    } else {
      this.startNewTask(newTask);
    }
  }

  startNewTask(task: { id: number; name: string } | null) {
    if (!task) return;

    if (this.nonWorkingPeriodActive && !['Lunch', 'Break', 'Day Off'].includes(task.name)) {
      alert('You cannot start a working task while on a break or day off.');
      return;
    }

    this.taskService.startTask(task.id).subscribe({
      next: () => {
        this.selectedTask = task;
        this.seconds = 0;
        this.resumeSeconds = 0;
        this.showStartButton = false;
        this.startTimer();
        this.nonWorkingPeriodActive = ['Lunch', 'Break', 'Day Off'].includes(task.name);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to start the task.');
      }
    });
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (!this.isPaused) this.seconds++;
    }, 1000);
    this.isPaused = false;
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isPaused = true;
  }

  pushTask() {
  this.taskService.endTask().subscribe({
    next: () => {
      alert('Task pushed!');
      this.stopTimer();

      this.resumeSeconds = this.seconds;
      this.showStartButton = true;

      // ❌ Don't clear selectedTask — keep it so "Start" shows
      // ✅ This will allow Start button to appear for the same task
      // this.selectedTask = null;

      this.nonWorkingPeriodActive = false;
    },
    error: () => alert('Failed to push the task.')
  });
}
 resumeTask() {
  if (!this.selectedTask) return;

  this.taskService.startTask(this.selectedTask.id).subscribe({
    next: () => {
      this.seconds = this.resumeSeconds;
      this.startTimer();
      this.showStartButton = false;
    },
    error: () => alert('Failed to resume task.')
  });
}

  stopCurrentBreak() {
    if (this.selectedTask && ['Lunch', 'Break', 'Day Off'].includes(this.selectedTask.name)) {
      this.taskService.endTask().subscribe({
        next: () => {
          alert(`${this.selectedTask?.name} ended`);
          this.nonWorkingPeriodActive = false;
          this.stopTimer();
          this.seconds = 0;
          this.selectedTask = null;
          this.showStartButton = false;
        },
        error: () => alert('Failed to end break.')
      });
    }
  }

  dayOff() {
    if (this.nonWorkingPeriodActive) {
      alert('You already have an active break or day off.');
      return;
    }

    const dayOffTask = this.tasks.find(t => t.name === 'Day Off');
    if (!dayOffTask) return;

    this.taskService.startTask(dayOffTask.id).subscribe({
      next: () => {
        alert('Marked as Day Off');
        this.stopTimer();
        this.seconds = 0;
        this.selectedTask = dayOffTask;
        this.showStartButton = false;
        this.nonWorkingPeriodActive = true;
      },
      error: () => alert('Failed to mark Day Off.')
    });
  }

 stopTask() {
  if (this.selectedTask) {
    this.taskService.endTask().subscribe({
      next: () => {
        alert('Task stopped and saved.');
        this.stopTimer();
        this.seconds = 0;
        this.selectedTask = null;
        this.showStartButton = false;
        this.nonWorkingPeriodActive = false;
      },
      error: () => alert('Failed to stop task.')
    });
  } else {
    alert('No active task.');
  }
}


  formatTime(): string {
    const h = Math.floor(this.seconds / 3600);
    const m = Math.floor((this.seconds % 3600) / 60);
    const s = this.seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  goToUserHistory() {
    this.router.navigate(['/user-history']);
  }
}
