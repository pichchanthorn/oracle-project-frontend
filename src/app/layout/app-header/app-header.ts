import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthRole, AuthService } from '../../auth.service';

const ROLE_LABELS: Record<AuthRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  ASSOCIATE: 'Associate',
};

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
})
export class AppHeader {
  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  get userName(): string {
    return this.authService.getCurrentUserDisplay()?.fullName ?? 'User';
  }

  get userRoleLabel(): string {
    const role = this.authService.getCurrentUserDisplay()?.role;
    return role ? ROLE_LABELS[role] : '—';
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
