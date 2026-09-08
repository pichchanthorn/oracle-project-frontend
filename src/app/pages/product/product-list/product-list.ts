import { Component, OnInit, signal } from '@angular/core';
import { ProductService, ProductApiModel } from '../../../services/product.service';
import { CategoryService, CategoryApiModel } from '../../../services/category.service';
import { UnitService, UnitApiModel } from '../../../services/unit.service';

interface InventoryProduct {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  unitId: number;
  unitPrice: number;
  description: string;
  active: boolean;
  categoryName: string;
  unitName: string;
}

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  isModalOpen = false;
  isLoading = signal(false);
  errorMessage = signal('');

  editingProductId: number | null = null;

  products = signal<InventoryProduct[]>([]);
  categories = signal<CategoryApiModel[]>([]);
  units = signal<UnitApiModel[]>([]);

  newProduct = {
    sku: '',
    name: '',
    categoryId: null as number | null,
    unitId: null as number | null,
    unitPrice: null as number | null,
    description: '',
    active: true
  };

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private unitService: UnitService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadUnits();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productService.getAll().subscribe({
      next: (data) => {
        this.products.set(data.map((product) => this.toViewModel(product)));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.errorMessage.set('Could not reach the API server. Is it running on http://localhost:3000?');
        this.isLoading.set(false);
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  private loadUnits(): void {
    this.unitService.getAll().subscribe({
      next: (data) => this.units.set(data),
      error: (err) => console.error('Failed to load units', err)
    });
  }

  private toViewModel(product: ProductApiModel): InventoryProduct {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      unitId: product.unitId,
      unitPrice: product.unitPrice,
      description: product.description,
      active: product.active,
      categoryName: product.categoryName,
      unitName: product.unitName
    };
  }

  get isEditing(): boolean {
    return this.editingProductId !== null;
  }

  openModal(): void {
    this.editingProductId = null;
    this.newProduct = {
      sku: '',
      name: '',
      categoryId: null,
      unitId: null,
      unitPrice: null,
      description: '',
      active: true
    };
    this.isModalOpen = true;
  }

  openEditModal(product: InventoryProduct): void {
    this.editingProductId = product.id;
    this.newProduct = {
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      unitId: product.unitId,
      unitPrice: product.unitPrice,
      description: product.description,
      active: product.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveProduct(): void {
    if (
      !this.newProduct.sku.trim() ||
      !this.newProduct.name.trim() ||
      this.newProduct.categoryId === null ||
      this.newProduct.unitId === null ||
      this.newProduct.unitPrice === null
    ) {
      return;
    }

    const payload = {
      sku: this.newProduct.sku.trim(),
      name: this.newProduct.name.trim(),
      categoryId: this.newProduct.categoryId,
      unitId: this.newProduct.unitId,
      unitPrice: this.newProduct.unitPrice,
      description: this.newProduct.description.trim(),
      active: this.newProduct.active
    };

    if (this.editingProductId !== null) {
      this.productService.update(this.editingProductId, payload).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update product', err);
          this.errorMessage.set('Could not update product.');
        }
      });
      return;
    }

    this.productService.create(payload).subscribe({
      next: () => {
        this.loadProducts();
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to create product', err);
        this.errorMessage.set('Could not create product.');
      }
    });
  }

  trackByProductId(_: number, product: InventoryProduct): number {
    return product.id;
  }
}
