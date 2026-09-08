import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductApiModel {
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

export interface ProductCreatePayload {
  sku: string;
  name: string;
  categoryId: number;
  unitId: number;
  unitPrice: number;
  description?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Points at the Node/Express API which talks to the Oracle database.
  // Update this if the API runs on a different host/port.
  private readonly apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProductApiModel[]> {
    return this.http.get<ProductApiModel[]>(this.apiUrl);
  }

  create(payload: ProductCreatePayload): Observable<ProductApiModel> {
    return this.http.post<ProductApiModel>(this.apiUrl, payload);
  }

  update(id: number, payload: ProductCreatePayload): Observable<ProductApiModel> {
    return this.http.patch<ProductApiModel>(`${this.apiUrl}/${id}`, payload);
  }
}
