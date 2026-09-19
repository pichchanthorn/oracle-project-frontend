import { Component } from '@angular/core';
import { Router } from '@angular/router';

// Shown when pageAccessGuard denies an authenticated user access to a page
// they don't have the role for. This is a UX destination only — it makes no
// authorization decision itself and performs no auth state changes.
@Component({
  selector: 'app-forbidden',
  standalone: false,
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {
  constructor(private readonly router: Router) {}

  goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }
}
