import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-details',
  imports: [FormsModule, CommonModule],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
  userId!: number;
  userInfo: any;
  taskHistory: any[] = [];
  breakHistory: any[] = [];
  errorMessage: string = '';

  searchTerm: string = '';
  lunchBreakTotal: string = '';

  monthlyTaskHistory: { [month: string]: any[] } = {};
  monthlyTotals: { [month: string]: number } = {};

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadUserData();
  }

  private getToken(): Promise<string | null> {
    return Promise.resolve(localStorage.getItem('token'));
  }

  private loadUserData(): void {
    this.getToken()
      .then(token => {
        if (!token) {
          this.errorMessage = 'User not authenticated';
          return;
        }
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

        this.http.get(`http://localhost:5236/api/User/${this.userId}`, { headers }).subscribe({
          next: data => this.userInfo = data,
          error: () => this.errorMessage = 'Failed to load user info.'
        });

        this.http.get<any[]>(`http://localhost:5236/api/task/admin/history/${this.userId}`, { headers }).subscribe({
          next: data => {
            this.breakHistory = data.filter(t => t.taskName === 'Lunch' || t.taskName === 'Day Off');
            this.taskHistory = data.filter(t => !(t.taskName === 'Lunch' || t.taskName === 'Day Off'));

            this.aggregateTaskHistory();
            this.processBreaks();
          },
          error: () => this.errorMessage = 'Failed to load task history.'
        });
      })
      .catch(() => {
        this.errorMessage = 'Authentication error.';
      });
  }

  aggregateTaskHistory() {
    const grouped = new Map<string, { taskName: string; totalSeconds: number; date: string }>();
    const monthMap: { [month: string]: any[] } = {};
    const monthTotals: { [month: string]: number } = {};

    for (const task of this.taskHistory) {
      const start = new Date(task.startTime);
      const end = new Date(task.endTime);
      const date = start.toISOString().split('T')[0];
      const month = start.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g. "May 2025"
      const key = `${date}_${task.taskName}`;
      const duration = (end.getTime() - start.getTime()) / 1000;

      if (grouped.has(key)) {
        grouped.get(key)!.totalSeconds += duration;
      } else {
        grouped.set(key, { taskName: task.taskName, totalSeconds: duration, date });
      }

      if (!monthMap[month]) monthMap[month] = [];
      monthMap[month].push({ taskName: task.taskName, totalSeconds: duration, date });

      if (!monthTotals[month]) monthTotals[month] = 0;
      monthTotals[month] += duration;
    }

    this.monthlyTaskHistory = {};
    for (const [month, entries] of Object.entries(monthMap)) {
      const aggMap = new Map<string, { taskName: string; totalSeconds: number; date: string }>();
      for (const entry of entries) {
        const key = `${entry.date}_${entry.taskName}`;
        if (aggMap.has(key)) {
          aggMap.get(key)!.totalSeconds += entry.totalSeconds;
        } else {
          aggMap.set(key, { ...entry });
        }
      }
      this.monthlyTaskHistory[month] = Array.from(aggMap.values()).map(g => ({
        ...g,
        totalDuration: this.formatDuration(g.totalSeconds),
      }));
    }

    this.monthlyTotals = monthTotals;
  }

  getMonthKeys(): string[] {
    return Object.keys(this.monthlyTaskHistory).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA.getTime() - dateB.getTime();
    });
  }

  processBreaks() {
    const grouped = new Map<string, { breakType: string; totalSeconds: number; date: string }>();

    for (const b of this.breakHistory) {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const date = start.toISOString().split('T')[0];
      const key = `${date}_${b.taskName}`;
      const duration = (end.getTime() - start.getTime()) / 1000;

      if (grouped.has(key)) {
        grouped.get(key)!.totalSeconds += duration;
      } else {
        grouped.set(key, { breakType: b.taskName, totalSeconds: duration, date });
      }
    }

    const lunchSeconds = Array.from(grouped.values())
      .filter(b => b.breakType === 'Lunch')
      .reduce((sum, b) => sum + b.totalSeconds, 0);

    this.lunchBreakTotal = this.formatDuration(lunchSeconds);
  }

  formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  goToAdminDashboard() {
    this.router.navigate(['/admindashboard']);
  }

  // ** New function for filtering tasks by search term **
  getFilteredTasksForMonth(month: string) {
    if (!this.monthlyTaskHistory[month]) return [];

    if (!this.searchTerm) return this.monthlyTaskHistory[month];

    const term = this.searchTerm.toLowerCase();

    return this.monthlyTaskHistory[month].filter(task =>
      task.taskName.toLowerCase().includes(term)
    );
  }

  trackByTask(index: number, item: any) {
    return item.date + item.taskName;
  }
}
