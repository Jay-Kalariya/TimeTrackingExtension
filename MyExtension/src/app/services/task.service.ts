import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';


export interface Task {
  id: number;
  name: string;
  projectId?: number;
}

export interface TaskSessionDto {
  id: number;
  taskId: number;
  taskName: string;
  startTime: string; // usually ISO string from API
  endTime?: string | null;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
private apiUrl = `${environment.apiBaseUrl}/Task`;

constructor(private http: HttpClient) {}


  startTask(taskTypeId: number) {
    return this.http.post(`${this.apiUrl}/start`, { taskTypeId });
  }
  endTask() {
    return this.http.post(`${this.apiUrl}/end`, {});
  }
  startBreak(breakType: string) {
    return this.http.post(`${this.apiUrl}/break`, JSON.stringify(breakType), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  getHistory() {
    return this.http.get(`${this.apiUrl}/history`);
  }
  // ✅ Fixed endpoint for admin history
  // ✅ Correct
  getUserHistory(userId: number): Observable<TaskSessionDto[]> {
    return this.http.get<TaskSessionDto[]>(
      `${this.apiUrl}/admin/history/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }
  getUserHistoryTask(): Observable<TaskSessionDto[]> {
    return this.http.get<TaskSessionDto[]>(`${this.apiUrl}/history`);
  }

  getAllTasks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl); // ✅ No `/task` at the end
  }

  getAssignedTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assigned`);
  }

  getTasksForDashboard(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard-tasks`);
  }


hasUserLoggedToday(): Observable<{ logged: boolean }> {
  return this.http.get<{ logged: boolean }>(`${this.apiUrl}/status/my`);
}

getUserProfile(): Observable<any> {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  };
  // Directly use the auth endpoint, not under /Task
  return this.http.get(`https://timetrackingextension.onrender.com/api/Auth/profile`, { headers });
}
}

