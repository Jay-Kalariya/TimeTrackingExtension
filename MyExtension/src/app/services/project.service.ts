import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Project {
  id?: number;
  name: string;
  createdByAdminId?: number;
  tasks?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private baseUrl = 'http://localhost:5236/api/Project'; // ✅ Updated base URL

  constructor(private http: HttpClient) {}

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}`, project);
  }
  assignTask(taskId: number, projectId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/assign-task?taskId=${taskId}&projectId=${projectId}`, {});
  }
  getAllProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl);
  }
  updateProject(id: number, project: Project): Observable<any> {
  return this.http.put(`${this.baseUrl}/${id}`, project);
}
deleteProject(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/${id}`);
}
}
