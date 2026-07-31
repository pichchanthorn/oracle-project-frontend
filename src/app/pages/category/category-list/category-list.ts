import { Component } from '@angular/core';

interface InventoryCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  itemCount: number;
  active: boolean;
}

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList {
  statusFilter: 'All Statuses' | 'Active Only' | 'Inactive Only' = 'Active Only';
  isModalOpen = false;

  categories: InventoryCategory[] = [
    { id: 1, name: 'Diamonds', description: 'Loose and set diamonds', icon: 'diamond', itemCount: 2730, active: true },
    { id: 2, name: 'Emeralds', description: 'Precious green gemstones', icon: 'brightness_5', itemCount: 630, active: true },
    { id: 3, name: 'Rubies', description: 'Precious red gemstones', icon: 'local_fire_department', itemCount: 420, active: true },
    { id: 4, name: 'Sapphires', description: 'Precious blue gemstones', icon: 'water_drop', itemCount: 420, active: false }
  ];

  newCategory = {
    name: '',
    description: '',
    icon: 'category',
    active: true
  };

  get filteredCategories(): InventoryCategory[] {
    return this.categories.filter((category) => {
      return (
        this.statusFilter === 'All Statuses' ||
        (this.statusFilter === 'Active Only' && category.active) ||
        (this.statusFilter === 'Inactive Only' && !category.active)
      );
    });
  }

  get activeCategoryCount(): number {
    return this.categories.filter((category) => category.active).length;
  }

  get totalItemCount(): number {
    return this.categories.reduce((sum, category) => sum + category.itemCount, 0);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  toggleCategoryStatus(category: InventoryCategory): void {
    category.active = !category.active;
  }

  createCategory(): void {
    if (!this.newCategory.name.trim()) {
      return;
    }

    this.categories = [
      ...this.categories,
      {
        id: this.categories.length + 1,
        name: this.newCategory.name.trim(),
        description: this.newCategory.description.trim() || 'No description provided',
        icon: this.newCategory.icon || 'category',
        itemCount: 0,
        active: this.newCategory.active
      }
    ];

    this.newCategory = {
      name: '',
      description: '',
      icon: 'category',
      active: true
    };
    this.closeModal();
  }

  trackByCategoryId(_: number, category: InventoryCategory): number {
    return category.id;
  }
}
