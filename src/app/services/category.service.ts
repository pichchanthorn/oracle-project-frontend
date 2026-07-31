import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryApiModel {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  // Points at the Node/Express API which talks to the Oracle database.
  // Update this if the API runs on a different host/port.
  private readonly apiUrl = 'http://localhost:3000/api/categories';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CategoryApiModel[]> {
    return this.http.get<CategoryApiModel[]>(this.apiUrl);
  }

  create(payload: { name: string; description: string; active: boolean }): Observable<CategoryApiModel> {
    return this.http.post<CategoryApiModel>(this.apiUrl, payload);
  }

  toggleStatus(id: number): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${id}/toggle`, {});
  }
}
