import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface SidebarItem {
  icon: string;
  label: string;
  route?: string;
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
    { icon: 'grid_view', label: 'Dashboard', route: '/dashboard' },
    { icon: 'receipt_long', label: 'Transactions' },
    { icon: 'workspace_premium', label: 'Certificates' },
    { icon: 'groups', label: 'Clients' }
  ];

  readonly settingsGroup: SidebarGroup = {
    icon: 'settings',
    label: 'Settings',
    children: [
      { icon: 'straighten', label: 'Unit', route: '/units' },
      { icon: 'category', label: 'Category', route: '/categories' },
      { icon: 'diamond', label: 'Ingredient', route: '/ingredients' },
      { icon: 'inventory_2', label: 'Product', route: '/products' }
    ]
  };

  constructor(private readonly router: Router) {}

  get isSettingsRoute(): boolean {
    return (
      this.router.url === '/units' ||
      this.router.url === '/categories' ||
      this.router.url === '/products'
    );
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
