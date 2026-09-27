import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type InventoryReason = 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryMovement {
  id: number;
  productId: number;
  quantityChange: number;
  reason: InventoryReason;
  changedBy: number;
  changedAt: string;
}

export interface CreateInventoryMovementRequest {
  productId: number;
  quantityChange: number;
  reason: InventoryReason;
}

export interface ProductStock {
  productId: number;
  currentStock: number;
}

export interface InventoryMovementFilters {
  productId?: number;
  reason?: InventoryReason;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  // Points at the Node/Express API which talks to the Oracle database.
  // Update this if the API runs on a different host/port.
  private readonly apiUrl = 'http://localhost:3000/api/inventory';

  constructor(private http: HttpClient) {}

  getMovements(filters?: InventoryMovementFilters): Observable<InventoryMovement[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.productId !== undefined) {
        params = params.set('productId', filters.productId);
      }
      if (filters.reason !== undefined) {
        params = params.set('reason', filters.reason);
      }
      if (filters.from !== undefined) {
        params = params.set('from', filters.from);
      }
      if (filters.to !== undefined) {
        params = params.set('to', filters.to);
      }
      if (filters.limit !== undefined) {
        params = params.set('limit', filters.limit);
      }
      if (filters.offset !== undefined) {
        params = params.set('offset', filters.offset);
      }
    }

    return this.http.get<InventoryMovement[]>(`${this.apiUrl}/movements`, { params });
  }

  getStock(productId: number): Observable<ProductStock> {
    return this.http.get<ProductStock>(`${this.apiUrl}/products/${productId}/stock`);
  }

  createMovement(payload: CreateInventoryMovementRequest): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(`${this.apiUrl}/movements`, payload);
  }
}
