import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole = 'ADMIN' | 'MANAGER' | 'ASSOCIATE';

export interface User {
  userId: number;
  username: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  fullName: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  // Points at the Node/Express API which talks to the Oracle database.
  // Update this if the API runs on a different host/port.
  private readonly apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(payload: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, payload);
  }

  updateUser(id: number, payload: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, payload);
  }

  updateUserStatus(id: number, payload: UpdateUserStatusRequest): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/status`, payload);
  }
}
