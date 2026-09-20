import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserRole,
  UserService,
} from '../../../services/user.service';
import { AuthService } from '../../../auth.service';

type RoleFilter = 'ALL' | UserRole;
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

interface UserFormModel {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
}

function emptyFormModel(): UserFormModel {
  return { username: '', password: '', fullName: '', email: '', role: 'ASSOCIATE' };
}

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
  readonly successMessage = signal('');

  searchTerm = '';
  roleFilter: RoleFilter = 'ALL';
  statusFilter: StatusFilter = 'ALL';

  // --- Create / Edit form state ---
  isFormOpen = false;
  editingUserId: number | null = null;
  formModel: UserFormModel = emptyFormModel();
  readonly isSaving = signal(false);
  readonly formError = signal('');

  // --- Activate / deactivate confirmation state ---
  statusChangeTarget: User | null = null;
  readonly isChangingStatus = signal(false);
  readonly statusError = signal('');

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

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

  /**
   * UI-only visibility check for the management actions (Create/Edit/
   * Activate/Deactivate). This never grants real authority — the backend
   * remains the authoritative enforcement point for every request. Reads
   * the role via AuthService (never localStorage/JWT directly), matching
   * the existing PageAccessService pattern.
   */
  get canManageUsers(): boolean {
    const role = this.authService.getCurrentRole();
    return role === 'ADMIN' || role === 'MANAGER';
  }

  get isEditing(): boolean {
    return this.editingUserId !== null;
  }

  // --- Create / Edit -------------------------------------------------

  openCreateModal(): void {
    this.editingUserId = null;
    this.formModel = emptyFormModel();
    this.formError.set('');
    this.isFormOpen = true;
  }

  openEditModal(user: User): void {
    this.editingUserId = user.userId;
    this.formModel = {
      username: user.username,
      password: '',
      fullName: user.fullName,
      email: user.email ?? '',
      role: user.role
    };
    this.formError.set('');
    this.isFormOpen = true;
  }

  closeForm(): void {
    if (this.isSaving()) {
      return;
    }
    this.isFormOpen = false;
    this.formModel = emptyFormModel();
    this.editingUserId = null;
    this.formError.set('');
  }

  saveUser(): void {
    if (this.isSaving()) {
      return;
    }

    this.formError.set('');

    const fullName = this.formModel.fullName.trim();
    const email = this.formModel.email.trim();

    if (this.isEditing) {
      const payload: UpdateUserRequest = {
        fullName,
        email: email || undefined,
        role: this.formModel.role
      };

      this.isSaving.set(true);

      this.userService.updateUser(this.editingUserId as number, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.isFormOpen = false;
          this.formModel = emptyFormModel();
          this.editingUserId = null;
          this.successMessage.set('User updated successfully.');
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.formError.set(this.describeSaveError(err, 'update'));
        }
      });
      return;
    }

    const username = this.formModel.username.trim();
    const password = this.formModel.password;

    if (!username || !password || !fullName) {
      this.formError.set('Username, password, and full name are required.');
      return;
    }

    const payload: CreateUserRequest = {
      username,
      password,
      fullName,
      email: email || undefined,
      role: this.formModel.role
    };

    this.isSaving.set(true);

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormOpen = false;
        this.formModel = emptyFormModel();
        this.successMessage.set('User created successfully.');
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        // Password is intentionally left in the form so the admin doesn't
        // have to retype everything after e.g. a duplicate-username 409 —
        // it is never logged and never leaves this in-memory form model.
        this.formError.set(this.describeSaveError(err, 'create'));
      }
    });
  }

  // --- Activate / deactivate ------------------------------------------

  requestStatusChange(user: User): void {
    this.statusError.set('');
    this.statusChangeTarget = user;
  }

  cancelStatusChange(): void {
    if (this.isChangingStatus()) {
      return;
    }
    this.statusChangeTarget = null;
    this.statusError.set('');
  }

  confirmStatusChange(): void {
    if (!this.statusChangeTarget || this.isChangingStatus()) {
      return;
    }

    const target = this.statusChangeTarget;
    const nextActive = !target.isActive;

    this.isChangingStatus.set(true);
    this.statusError.set('');

    this.userService.updateUserStatus(target.userId, { isActive: nextActive }).subscribe({
      next: () => {
        this.isChangingStatus.set(false);
        this.statusChangeTarget = null;
        this.successMessage.set(
          nextActive ? 'User activated successfully.' : 'User deactivated successfully.'
        );
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.isChangingStatus.set(false);
        this.statusError.set(this.describeStatusError(err));
      }
    });
  }

  dismissSuccessMessage(): void {
    this.successMessage.set('');
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

  private describeSaveError(err: HttpErrorResponse, action: 'create' | 'update'): string {
    const backendMessage = this.extractBackendMessage(err);

    switch (err.status) {
      case 400:
        return backendMessage || 'Please check the form for invalid values.';
      case 401:
        return 'You need to sign in again to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'This user could not be found. It may have been removed.';
      case 409:
        return backendMessage || 'That username is already in use.';
      case 500:
        return 'A server error occurred. Please try again later.';
      default:
        return action === 'create'
          ? 'Could not create the user right now. Please try again.'
          : 'Could not update the user right now. Please try again.';
    }
  }

  private describeStatusError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 401:
        return 'You need to sign in again to continue.';
      case 403:
        return 'You do not have permission to change this user’s status.';
      case 404:
        return 'This user could not be found. It may have been removed.';
      case 409:
        return 'This status change could not be completed due to a conflict.';
      case 500:
        return 'A server error occurred. Please try again later.';
      default:
        return 'Could not update the user’s status right now. Please try again.';
    }
  }

  // Only surfaces the backend's own validation message text (e.g. "Email is
  // already registered") — never stack traces or internal details — and
  // only for the status codes above where the backend is known to return a
  // safe, user-facing `error` string in its JSON body.
  private extractBackendMessage(err: HttpErrorResponse): string | null {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.error === 'string') {
      return body.error;
    }
    return null;
  }
}
