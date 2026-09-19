import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { User, UserRole, UserService } from '../../../services/user.service';

type RoleFilter = 'ALL' | UserRole;
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit {
  // Source data straight from the API — never mutated by filtering.
  private readonly users = signal<User[]>([]);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  searchTerm = '';
  roleFilter: RoleFilter = 'ALL';
  statusFilter: StatusFilter = 'ALL';

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.users.set([]);
        this.isLoading.set(false);
        this.errorMessage.set(this.describeLoadError(err));
      }
    });
  }

  get totalCount(): number {
    return this.users().length;
  }

  get filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.users().filter((user) => {
      const matchesSearch =
        !term ||
        user.username.toLowerCase().includes(term) ||
        user.fullName.toLowerCase().includes(term);

      const matchesRole = this.roleFilter === 'ALL' || user.role === this.roleFilter;

      const matchesStatus =
        this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && user.isActive) ||
        (this.statusFilter === 'INACTIVE' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || this.roleFilter !== 'ALL' || this.statusFilter !== 'ALL';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'ALL';
    this.statusFilter = 'ALL';
  }

  trackByUserId(_: number, user: User): number {
    return user.userId;
  }

  private describeLoadError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 401:
        return 'You need to sign in again to view users.';
      case 403:
        return 'You do not have permission to view user management.';
      case 404:
        return 'The user management resource could not be found.';
      case 409:
        return 'This request could not be completed due to a conflict. Please try again.';
      case 500:
        return 'A server error occurred while loading users. Please try again later.';
      default:
        return 'Could not load users right now. Please try again.';
    }
  }
}
