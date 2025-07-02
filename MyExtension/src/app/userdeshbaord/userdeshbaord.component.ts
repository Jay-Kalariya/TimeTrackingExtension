import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../services/task.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

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
  hasLoggedToday: boolean = false;
  username: string = '';

  constructor(
    private taskService: TaskService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
    if (this.isLoggedIn) {
      this.getUserProfile(); // ⬅️ Add this call
    }
    this.checkLoggedStatus();

    
     this.taskService.getTasksForDashboard().subscribe({
      next: (res) => {
        this.tasks = res;
         this.fetchActiveTask();
      },
      error: () => this.toastr.error('Failed to load tasks')
    });
    this.updateCurrentISTTime();
    setInterval(() => this.updateCurrentISTTime(), 1000);
  }

 


 fetchActiveTask() {
  this.taskService.getActiveTask().subscribe({
    next: (activeTask) => {
      if (activeTask && activeTask.taskId && activeTask.startTime) {
        this.selectedTask = this.tasks.find(t => t.id === activeTask.taskId) || null;

        if (this.selectedTask) {
          const startTime = new Date(Date.parse(activeTask.startTime)); // ⬅️ This is in UTC
          const now = new Date(); // Also UTC
          
          // ✅ Make sure both are treated as UTC (they already are in JavaScript)
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

          // ❗ Clamp to 0 if somehow negative due to clock skew
          this.seconds = elapsedSeconds > 0 ? elapsedSeconds : 0;

          this.startTimer();
          this.showStartButton = false;
          this.nonWorkingPeriodActive = ['Lunch', 'Break', 'Day Off'].includes(this.selectedTask.name);
        }
      }
    },
    error: () => this.toastr.error('Failed to fetch active task')
  });
}


  ngOnDestroy(): void {
    this.stopTimer();
  }

  updateCurrentISTTime() {
    const nowUTC = new Date();
  try{
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
    catch (err) {
    console.error('Failed to format IST time', err);
    this.currentISTTime = new Date().toLocaleTimeString(); // fallback
  }
  }

  selectTask(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newTaskId = +target.value;
    const newTask = this.tasks.find(t => t.id === newTaskId) || null;

    if (this.nonWorkingPeriodActive && newTask && !['Lunch', 'Break', 'Day Off'].includes(newTask.name)) {
      this.toastr.warning('You cannot start a working task while on a break or day off.');
      setTimeout(() => {
        target.value = this.selectedTask?.id.toString() ?? '';
      });
      return;
    }

    if (this.selectedTask && this.selectedTask.id !== newTaskId) {
      this.taskService.endTask().subscribe({
        next: () => this.startNewTask(newTask),
        error: () => this.toastr.error('Failed to end current task.')
      });
    } else {
      this.startNewTask(newTask);
    }
  }

  startNewTask(task: { id: number; name: string } | null) {
    if (!task) return;

    if (this.nonWorkingPeriodActive && !['Lunch', 'Break', 'Day Off'].includes(task.name)) {
      this.toastr.warning('You cannot start a working task while on a break or day off.');
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
        this.toastr.success(`${task.name} started`);
      },
      error: (err) => this.toastr.error(err.error?.message || 'Failed to start the task.')
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
        this.toastr.success('Task pushed!');
        this.stopTimer();
        this.resumeSeconds = this.seconds;
        this.showStartButton = true;
        this.nonWorkingPeriodActive = false;
      },
      error: () => this.toastr.error('Failed to push the task.')
    });
  }

  resumeTask() {
    if (!this.selectedTask) return;

    this.taskService.startTask(this.selectedTask.id).subscribe({
      next: () => {
        this.seconds = this.resumeSeconds;
        this.startTimer();
        this.showStartButton = false;
        this.toastr.success('Task resumed');
      },
      error: () => this.toastr.error('Failed to resume task.')
    });
  }

  stopCurrentBreak() {
    if (this.selectedTask && ['Lunch', 'Break', 'Day Off'].includes(this.selectedTask.name)) {
      this.taskService.endTask().subscribe({
        next: () => {
          this.toastr.success(`${this.selectedTask?.name} ended`);
          this.nonWorkingPeriodActive = false;
          this.stopTimer();
          this.seconds = 0;
          this.selectedTask = null;
          this.showStartButton = false;
        },
        error: () => this.toastr.error('Failed to end break.')
      });
    }
  }

  dayOff() {
    if (this.nonWorkingPeriodActive) {
      this.toastr.warning('You already have an active break or day off.');
      return;
    }

    const dayOffTask = this.tasks.find(t => t.name === 'Day Off');
    if (!dayOffTask) return;

    this.taskService.startTask(dayOffTask.id).subscribe({
      next: () => {
        this.toastr.success('Marked as Day Off');
        this.stopTimer();
        this.seconds = 0;
        this.selectedTask = dayOffTask;
        this.showStartButton = false;
        this.nonWorkingPeriodActive = true;
      },
      error: () => this.toastr.error('Failed to mark Day Off.')
    });
  }

  stopTask() {
    if (this.selectedTask) {
      this.taskService.endTask().subscribe({
        next: () => {
          this.toastr.success('Task stopped and saved.');
          this.stopTimer();
          this.seconds = 0;
          this.selectedTask = null;
          this.showStartButton = false;
          this.nonWorkingPeriodActive = false;
        },
        error: () => this.toastr.error('Failed to stop task.')
      });
    } else {
      this.toastr.info('No active task.');
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

  checkLoggedStatus(): void {
    this.taskService.hasUserLoggedToday().subscribe({
      next: (res) => {
        this.hasLoggedToday = res.logged;
      },
      error: () => {
        this.hasLoggedToday = false;
        this.toastr.error('Failed to fetch logged status.');
      }
    });


  }

  getUserProfile() {
    this.taskService.getUserProfile().subscribe({
      next: (res) => {
        this.username = res.username; // adjust key if backend sends something else
      },
      error: () => {
        this.toastr.error('Failed to fetch user profile');
      }
    });
  }

}
