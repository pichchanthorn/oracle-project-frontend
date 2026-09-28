import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'QR';

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateSaleRequest {
  paymentMethod: PaymentMethod;
  items: CreateSaleItemRequest[];
}

export interface Sale {
  saleId: number;
  customerId: number | null;
  cashierId: number;
  saleDate: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
}

export interface SaleItem {
  saleItemId: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateSaleResponse {
  sale: Sale;
  items: SaleItem[];
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  // Points at the Node/Express API which talks to the Oracle database.
  // Update this if the API runs on a different host/port.
  private readonly apiUrl = 'http://localhost:3000/api/sales';

  constructor(private http: HttpClient) {}

  createSale(request: CreateSaleRequest): Observable<CreateSaleResponse> {
    return this.http.post<CreateSaleResponse>(this.apiUrl, request);
  }

  getSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  getSaleById(id: number): Observable<CreateSaleResponse> {
    return this.http.get<CreateSaleResponse>(`${this.apiUrl}/${id}`);
  }
}
