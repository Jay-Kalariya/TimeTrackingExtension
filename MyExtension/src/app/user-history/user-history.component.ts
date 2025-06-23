import { Component, OnInit } from '@angular/core';
import { TaskService } from '../services/task.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-history',
  imports:[FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './user-history.component.html',
  styleUrls: ['./user-history.component.css']
})
export class UserHistoryComponent implements OnInit {
  userTaskHistory: any[] = [];
  filteredHistory: any[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  filterDate: string = '';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.taskService.getUserHistoryTask().subscribe({
      next: (data) => {
        this.userTaskHistory = data;
        this.applyFiltersAndPagination();
      },
      error: () => alert('Failed to load user task history.')
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  applyFiltersAndPagination() {
    let filtered = this.userTaskHistory;

    if (this.filterDate) {
      const selectedDate = new Date(this.filterDate);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);

      filtered = filtered.filter(entry => {
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        return (
          (start >= selectedDate && start < nextDay) ||
          (end >= selectedDate && end < nextDay)
        );
      });
    }

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredHistory = filtered.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
    }
  }

  formatDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '0h 0m 0s';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60); // ✅ Round down seconds
  return `${h}h ${m}m ${s}s`;
}

}
