import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CreateInventoryMovementRequest,
  InventoryMovement,
  InventoryReason,
  InventoryService,
} from '../../../services/inventory.service';
import { ProductApiModel, ProductService } from '../../../services/product.service';
import { AuthService } from '../../../auth.service';

type ReasonFilter = 'ALL' | InventoryReason;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

interface MovementFormModel {
  productId: number | null;
  reason: InventoryReason;
  quantityChange: number | null;
}

function emptyFormModel(): MovementFormModel {
  return { productId: null, reason: 'RESTOCK', quantityChange: null };
}

@Component({
  selector: 'app-inventory-list',
  standalone: false,
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.css',
})
export class InventoryList implements OnInit {
  // Source data straight from the API — never mutated by filtering.
  readonly movements = signal<InventoryMovement[]>([]);
  readonly products = signal<ProductApiModel[]>([]);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  productFilter: number | null = null;
  reasonFilter: ReasonFilter = 'ALL';
  fromFilter = '';
  toFilter = '';

  readonly limit = DEFAULT_LIMIT;
  offset = 0;

  // --- Selected-product stock display ---
  readonly selectedStock = signal<number | null>(null);
  readonly isLoadingStock = signal(false);

  // --- Record Movement form state ---
  isFormOpen = false;
  formModel: MovementFormModel = emptyFormModel();
  readonly isSaving = signal(false);
  readonly formError = signal('');

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly productService: ProductService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadMovements();
  }

  /**
   * UI-only visibility check for the Record Movement action. This never
   * grants real authority — the backend's own requireRole('ADMIN','MANAGER')
   * on POST /api/inventory/movements remains the actual enforcement point.
   * Reads the role via AuthService (never localStorage/JWT directly),
   * matching the existing pattern already used by user-list.ts.
   */
  get canRecordMovement(): boolean {
    const role = this.authService.getCurrentRole();
    return role === 'ADMIN' || role === 'MANAGER';
  }

  get totalCount(): number {
    return this.movements().length;
  }

  loadMovements(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.inventoryService
      .getMovements({
        productId: this.productFilter ?? undefined,
        reason: this.reasonFilter === 'ALL' ? undefined : this.reasonFilter,
        from: this.fromFilter || undefined,
        to: this.toFilter || undefined,
        limit: this.limit,
        offset: this.offset,
      })
      .subscribe({
        next: (data) => {
          this.movements.set(data);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.movements.set([]);
          this.isLoading.set(false);
          this.errorMessage.set(this.describeLoadError(err));
        }
      });
  }

  private loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data) => this.products.set(data),
      error: () => this.products.set([])
    });
  }

  productName(productId: number): string {
    const product = this.products().find((p) => p.id === productId);
    return product ? product.name : `#${productId}`;
  }

  get hasActiveFilters(): boolean {
    return (
      this.productFilter !== null ||
      this.reasonFilter !== 'ALL' ||
      this.fromFilter !== '' ||
      this.toFilter !== ''
    );
  }

  applyFilters(): void {
    this.offset = 0;
    this.loadMovements();
  }

  resetFilters(): void {
    this.productFilter = null;
    this.reasonFilter = 'ALL';
    this.fromFilter = '';
    this.toFilter = '';
    this.selectedStock.set(null);
    this.offset = 0;
    this.loadMovements();
  }

  // --- Pagination ---

  get canGoToPreviousPage(): boolean {
    return this.offset > 0;
  }

  get canGoToNextPage(): boolean {
    return this.totalCount === this.limit;
  }

  goToPreviousPage(): void {
    if (!this.canGoToPreviousPage) {
      return;
    }
    this.offset = Math.max(0, this.offset - this.limit);
    this.loadMovements();
  }

  goToNextPage(): void {
    if (!this.canGoToNextPage) {
      return;
    }
    this.offset += this.limit;
    this.loadMovements();
  }

  // --- Stock lookup for the filtered product ---

  onProductFilterChange(): void {
    this.selectedStock.set(null);

    if (this.productFilter === null) {
      return;
    }

    this.isLoadingStock.set(true);
    this.inventoryService.getStock(this.productFilter).subscribe({
      next: (stock) => {
        this.selectedStock.set(stock.currentStock);
        this.isLoadingStock.set(false);
      },
      error: () => {
        this.selectedStock.set(null);
        this.isLoadingStock.set(false);
      }
    });
  }

  trackByMovementId(_: number, movement: InventoryMovement): number {
    return movement.id;
  }

  // --- Record Movement ---

  openRecordMovementModal(): void {
    this.formModel = emptyFormModel();
    this.formError.set('');
    this.isFormOpen = true;
  }

  closeForm(): void {
    if (this.isSaving()) {
      return;
    }
    this.isFormOpen = false;
    this.formModel = emptyFormModel();
    this.formError.set('');
  }

  /** MAX allowed by the backend — surfaced to the template for a hint only; not enforced client-side beyond this component's own limit constant. */
  get maxLimit(): number {
    return MAX_LIMIT;
  }

  get isQuantityValid(): boolean {
    const quantity = this.formModel.quantityChange;

    if (quantity === null || !Number.isInteger(quantity) || quantity === 0) {
      return false;
    }

    if (this.formModel.reason === 'RESTOCK' || this.formModel.reason === 'RETURN') {
      return quantity > 0;
    }

    return true;
  }

  get isFormValid(): boolean {
    return this.formModel.productId !== null && this.isQuantityValid;
  }

  saveMovement(): void {
    if (this.isSaving() || !this.isFormValid) {
      return;
    }

    this.formError.set('');
    this.isSaving.set(true);

    const payload: CreateInventoryMovementRequest = {
      productId: this.formModel.productId as number,
      quantityChange: this.formModel.quantityChange as number,
      reason: this.formModel.reason
    };

    this.inventoryService.createMovement(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormOpen = false;
        this.formModel = emptyFormModel();
        this.successMessage.set('Movement recorded successfully.');
        this.loadMovements();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.formError.set(this.describeSaveError(err));
      }
    });
  }

  dismissSuccessMessage(): void {
    this.successMessage.set('');
  }

  private describeLoadError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 401:
        return 'You need to sign in again to view inventory.';
      case 403:
        return 'You do not have permission to view inventory.';
      case 404:
        return 'The inventory resource could not be found.';
      case 500:
        return 'A server error occurred while loading movements. Please try again later.';
      default:
        return 'Could not load inventory movements right now. Please try again.';
    }
  }

  private describeSaveError(err: HttpErrorResponse): string {
    const backendMessage = this.extractBackendMessage(err);

    switch (err.status) {
      case 400:
        return backendMessage || 'Please check the movement details and try again.';
      case 401:
        return 'You need to sign in again to continue.';
      case 403:
        return 'You do not have permission to record inventory movements.';
      case 404:
        return backendMessage || 'This product could not be found.';
      case 409:
        return backendMessage || 'This movement could not be completed.';
      case 500:
        return 'A server error occurred. Please try again later.';
      default:
        return 'Could not record the movement right now. Please try again.';
    }
  }

  // Only surfaces the backend's own safe, user-facing `error` string — never
  // stack traces or internal details — matching the pattern already used in
  // user-list.ts.
  private extractBackendMessage(err: HttpErrorResponse): string | null {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.error === 'string') {
      return body.error;
    }
    return null;
  }
}
