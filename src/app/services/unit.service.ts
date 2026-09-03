import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UnitApiModel {
  id: number;
  name: string;
  symbol: string;
}

@Injectable({ providedIn: 'root' })
export class UnitService {
  // Points at the Node/Express API which talks to the Oracle database.
  // Update this if the API runs on a different host/port.
  private readonly apiUrl = 'http://localhost:3000/api/units';

  constructor(private http: HttpClient) {}

  getAll(): Observable<UnitApiModel[]> {
    return this.http.get<UnitApiModel[]>(this.apiUrl);
  }

  create(payload: { name: string; symbol: string }): Observable<UnitApiModel> {
    return this.http.post<UnitApiModel>(this.apiUrl, payload);
  }

  update(id: number, payload: { name: string; symbol: string }): Observable<UnitApiModel> {
    return this.http.patch<UnitApiModel>(`${this.apiUrl}/${id}`, payload);
  }
}
