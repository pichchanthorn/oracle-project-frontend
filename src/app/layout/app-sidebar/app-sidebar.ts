import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { PageAccessService, PageCode } from '../../services/page-access.service';

interface SidebarItem {
  icon: string;
  label: string;
  route?: string;
  // Only routed items that are subject to page-level authorization carry a
  // pageCode. Items without one (Transactions/Certificates/Clients) have no
  // route yet either, so they are always shown as-is — see canView().
  pageCode?: PageCode;
}

interface SidebarGroup {
  icon: string;
  label: string;
  children: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './app-sidebar.html',
  styleUrl: './app-sidebar.css',
})
export class AppSidebar implements OnInit {
  private readonly storageKey = 'elite-diamonds-sidebar-collapsed';
  private readonly settingsStorageKey = 'elite-diamonds-settings-open';

  isCollapsed = true;
  isSettingsOpen = true;

  readonly navItems: SidebarItem[] = [
    { icon: 'grid_view', label: 'Dashboard', route: '/dashboard', pageCode: 'DASHBOARD' },
    { icon: 'receipt_long', label: 'Transactions' },
    { icon: 'workspace_premium', label: 'Certificates' },
    { icon: 'groups', label: 'Clients' }
  ];

  readonly settingsGroup: SidebarGroup = {
    icon: 'settings',
    label: 'Settings',
    children: [
      { icon: 'straighten', label: 'Unit', route: '/units', pageCode: 'UNITS' },
      { icon: 'category', label: 'Category', route: '/categories', pageCode: 'CATEGORIES' },
      { icon: 'diamond', label: 'Ingredient', route: '/ingredients', pageCode: 'INGREDIENTS' },
      { icon: 'inventory_2', label: 'Product', route: '/products', pageCode: 'PRODUCTS' },
      { icon: 'manage_accounts', label: 'User Management', route: '/users', pageCode: 'USERS' }
    ]
  };

  constructor(
    private readonly router: Router,
    private readonly pageAccessService: PageAccessService
  ) {}

  get isSettingsRoute(): boolean {
    return (
      this.router.url === '/units' ||
      this.router.url === '/categories' ||
      this.router.url === '/ingredients' ||
      this.router.url === '/products' ||
      this.router.url === '/users'
    );
  }

  /**
   * Whether a sidebar item should render for the current user. Delegates
   * entirely to the existing PageAccessService (the single authorization
   * source) rather than comparing roles here — this is UX-only convenience,
   * not a security boundary; authGuard/pageAccessGuard and the backend
   * remain the actual enforcement points regardless of what the sidebar
   * shows or hides.
   */
  canView(item: SidebarItem): boolean {
    if (!item.pageCode) {
      return true;
    }
    return this.pageAccessService.canViewPage(item.pageCode);
  }

  ngOnInit(): void {
    if (!this.canUseStorage()) {
      return;
    }

    const savedState = window.localStorage.getItem(this.storageKey);
    const savedSettingsState = window.localStorage.getItem(this.settingsStorageKey);

    this.isCollapsed = savedState === null ? true : savedState === 'true';
    this.isSettingsOpen = savedSettingsState === null ? true : savedSettingsState === 'true';
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;

    if (this.canUseStorage()) {
      window.localStorage.setItem(this.storageKey, String(this.isCollapsed));
    }
  }

  toggleSettings(): void {
    this.isSettingsOpen = !this.isSettingsOpen;

    if (this.canUseStorage()) {
      window.localStorage.setItem(this.settingsStorageKey, String(this.isSettingsOpen));
    }
  }

  private canUseStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }
}
