import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ProductApiModel, ProductService } from '../../../services/product.service';
import { CreateSaleResponse, Sale, SalesService } from '../../../services/sales.service';

const DEFAULT_LIMIT = 50;

@Component({
  selector: 'app-sales-history',
  standalone: false,
  templateUrl: './sales-history.html',
  styleUrl: './sales-history.css',
})
export class SalesHistory implements OnInit {
  readonly sales = signal<Sale[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal('');

  readonly limit = DEFAULT_LIMIT;
  offset = 0;

  // Loaded once and reused for productId -> name lookups in the detail
  // modal — the backend never returns productName (see SALES API CONTRACT).
  // Read-only consumer of the existing ProductService; never modified here.
  readonly products = signal<ProductApiModel[]>([]);

  // --- Sale detail modal ---
  readonly selectedSale = signal<CreateSaleResponse | null>(null);
  readonly isDetailOpen = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly detailError = signal('');

  constructor(
    private readonly salesService: SalesService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadSales();
  }

  loadSales(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.salesService.getSales(this.limit, this.offset).subscribe({
      next: (data) => {
        this.sales.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.sales.set([]);
        this.isLoading.set(false);
        this.loadError.set(this.describeLoadError(err));
      },
    });
  }

  retry(): void {
    this.loadSales();
  }

  private loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data) => this.products.set(data),
      error: () => this.products.set([]),
    });
  }

  productName(productId: number): string {
    const product = this.products().find((p) => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  }

  // --- Pagination ---
  // Backend has no total count, so "next" is only known to be available
  // when the current page was full (returned length === limit).

  get canGoToPreviousPage(): boolean {
    return this.offset > 0;
  }

  get canGoToNextPage(): boolean {
    return this.sales().length >= this.limit;
  }

  goToPreviousPage(): void {
    if (!this.canGoToPreviousPage) {
      return;
    }
    this.offset = Math.max(0, this.offset - this.limit);
    this.loadSales();
  }

  goToNextPage(): void {
    if (!this.canGoToNextPage) {
      return;
    }
    this.offset += this.limit;
    this.loadSales();
  }

  get currentPage(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  // --- Detail modal ---

  viewSale(saleId: number): void {
    this.isDetailOpen.set(true);
    this.selectedSale.set(null);
    this.detailError.set('');
    this.isLoadingDetail.set(true);

    this.salesService.getSaleById(saleId).subscribe({
      next: (response) => {
        this.selectedSale.set(response);
        this.isLoadingDetail.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingDetail.set(false);
        this.detailError.set(this.describeDetailError(err));
      },
    });
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedSale.set(null);
    this.detailError.set('');
    this.isLoadingDetail.set(false);
  }

  trackBySaleId(_: number, sale: Sale): number {
    return sale.saleId;
  }

  trackBySaleItemId(_: number, item: { saleItemId: number }): number {
    return item.saleItemId;
  }

  private describeLoadError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 401:
        return 'You need to sign in again to view sales history.';
      case 403:
        return 'You do not have permission to view sales history.';
      case 500:
        return 'A server error occurred while loading sales. Please try again later.';
      default:
        return 'Could not load sales history right now. Please try again.';
    }
  }

  private describeDetailError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 401:
        return 'You need to sign in again to view this sale.';
      case 403:
        return 'You do not have permission to view this sale.';
      case 404:
        return 'This sale could not be found.';
      case 500:
        return 'A server error occurred while loading this sale. Please try again.';
      default:
        return 'Could not load this sale right now. Please try again.';
    }
  }
}
