import { Component, OnInit, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ProductApiModel, ProductService } from '../../../services/product.service';
import {
  CreateSaleResponse,
  PaymentMethod,
  SalesService,
} from '../../../services/sales.service';

interface CartLine {
  product: ProductApiModel;
  quantity: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'QR'];

@Component({
  selector: 'app-sales-pos',
  standalone: false,
  templateUrl: './sales-pos.html',
  styleUrl: './sales-pos.css',
})
export class SalesPos implements OnInit {
  readonly paymentMethods = PAYMENT_METHODS;

  readonly products = signal<ProductApiModel[]>([]);
  readonly isLoadingProducts = signal(false);
  readonly loadError = signal('');

  readonly searchTerm = signal('');

  // Cart is keyed by productId so re-adding an existing product increases
  // its quantity instead of creating a duplicate line.
  readonly cartLines = signal<Map<number, CartLine>>(new Map());

  readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);

  readonly isSubmitting = signal(false);
  readonly submitError = signal('');
  readonly lastSale = signal<CreateSaleResponse | null>(null);

  constructor(
    private readonly productService: ProductService,
    private readonly salesService: SalesService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // --- Product picker ---

  readonly activeProducts = computed(() => this.products().filter((product) => product.active));

  readonly visibleProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const active = this.activeProducts();

    if (!term) {
      return active;
    }

    return active.filter(
      (product) =>
        product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term)
    );
  });

  loadProducts(): void {
    this.isLoadingProducts.set(true);
    this.loadError.set('');

    this.productService.getAll().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.products.set([]);
        this.isLoadingProducts.set(false);
        this.loadError.set('Could not load the product catalog. Please try again.');
      },
    });
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
  }

  // --- Cart ---

  readonly cartLineList = computed(() => Array.from(this.cartLines().values()));

  readonly cartSubtotal = computed(() =>
    this.cartLineList().reduce((sum, line) => sum + line.product.unitPrice * line.quantity, 0)
  );

  readonly cartItemCount = computed(() =>
    this.cartLineList().reduce((sum, line) => sum + line.quantity, 0)
  );

  addToCart(product: ProductApiModel): void {
    if (!product.active) {
      return;
    }

    const next = new Map(this.cartLines());
    const existing = next.get(product.id);

    next.set(product.id, {
      product,
      quantity: existing ? existing.quantity + 1 : 1,
    });

    this.cartLines.set(next);
  }

  increaseQuantity(productId: number): void {
    const next = new Map(this.cartLines());
    const line = next.get(productId);

    if (!line) {
      return;
    }

    next.set(productId, { ...line, quantity: line.quantity + 1 });
    this.cartLines.set(next);
  }

  decreaseQuantity(productId: number): void {
    const next = new Map(this.cartLines());
    const line = next.get(productId);

    if (!line) {
      return;
    }

    if (line.quantity <= 1) {
      next.delete(productId);
    } else {
      next.set(productId, { ...line, quantity: line.quantity - 1 });
    }

    this.cartLines.set(next);
  }

  removeLine(productId: number): void {
    const next = new Map(this.cartLines());
    next.delete(productId);
    this.cartLines.set(next);
  }

  trackByProduct(_: number, product: ProductApiModel): number {
    return product.id;
  }

  trackByCartLine(_: number, line: CartLine): number {
    return line.product.id;
  }

  // --- Submit ---

  readonly hasInvalidQuantity = computed(() =>
    this.cartLineList().some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0)
  );

  readonly canSubmit = computed(
    () =>
      this.cartLineList().length > 0 &&
      !this.hasInvalidQuantity() &&
      this.selectedPaymentMethod() !== null &&
      !this.isSubmitting()
  );

  submitSale(): void {
    if (!this.canSubmit() || this.isSubmitting()) {
      return;
    }

    this.submitError.set('');
    this.isSubmitting.set(true);

    this.salesService
      .createSale({
        paymentMethod: this.selectedPaymentMethod() as PaymentMethod,
        items: this.cartLineList().map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.lastSale.set(response);
          this.cartLines.set(new Map());
          this.selectedPaymentMethod.set(null);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.describeSaleError(err));
        },
      });
  }

  dismissLastSale(): void {
    this.lastSale.set(null);
  }

  dismissSubmitError(): void {
    this.submitError.set('');
  }

  private describeSaleError(err: HttpErrorResponse): string {
    const backendMessage = this.extractBackendMessage(err);

    switch (err.status) {
      case 400:
        return backendMessage || 'Please check the items in this sale and try again.';
      case 401:
        return 'You need to sign in again to continue.';
      case 404:
        return backendMessage || 'One of the selected products could not be found.';
      case 409:
        return backendMessage || 'This sale could not be completed — a product may be out of stock or inactive.';
      case 500:
        return 'A server error occurred while processing this sale. Please try again.';
      default:
        return 'Could not complete this sale right now. Please try again.';
    }
  }

  // Only surfaces the backend's own safe, user-facing `error` string — never
  // stack traces or internal details — matching the pattern already used in
  // inventory-list.ts.
  private extractBackendMessage(err: HttpErrorResponse): string | null {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.error === 'string') {
      return body.error;
    }
    return null;
  }
}
