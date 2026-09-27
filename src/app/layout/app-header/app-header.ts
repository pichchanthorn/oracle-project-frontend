import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
})
export class AppHeader {
  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
