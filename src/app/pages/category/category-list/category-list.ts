import { Component, OnInit } from '@angular/core';
import { CategoryService, CategoryApiModel } from '../../../services/category.service';

interface InventoryCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  itemCount: number;
  active: boolean;
}

// Cosmetic-only mapping — the database doesn't store an icon, so pick a
// sensible one client-side based on the category name.
const ICON_MAP: Record<string, string> = {
  Diamonds: 'diamond',
  Emeralds: 'brightness_5',
  Rubies: 'local_fire_department',
  Sapphires: 'water_drop'
};

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit {
  statusFilter: 'All Statuses' | 'Active Only' | 'Inactive Only' = 'Active Only';
  isModalOpen = false;
  isLoading = false;
  errorMessage = '';

  categories: InventoryCategory[] = [];

  newCategory = {
    name: '',
    description: '',
    active: true
  };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data.map((category) => this.toViewModel(category));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.errorMessage = 'Could not reach the API server. Is it running on http://localhost:3000?';
        this.isLoading = false;
      }
    });
  }

  private toViewModel(category: CategoryApiModel): InventoryCategory {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: ICON_MAP[category.name] || 'category',
      itemCount: 0, // not wired to product counts yet
      active: category.active
    };
  }

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
    const previous = category.active;
    category.active = !category.active; // optimistic UI update

    this.categoryService.toggleStatus(category.id).subscribe({
      error: (err) => {
        console.error('Failed to toggle category', err);
        category.active = previous; // revert on failure
        this.errorMessage = 'Could not update category status.';
      }
    });
  }

  createCategory(): void {
    if (!this.newCategory.name.trim()) {
      return;
    }

    this.categoryService
      .create({
        name: this.newCategory.name.trim(),
        description: this.newCategory.description.trim() || 'No description provided',
        active: this.newCategory.active
      })
      .subscribe({
        next: () => {
          this.loadCategories();
          this.newCategory = { name: '', description: '', active: true };
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to create category', err);
          this.errorMessage = 'Could not create category.';
        }
      });
  }

  trackByCategoryId(_: number, category: InventoryCategory): number {
    return category.id;
  }
}
