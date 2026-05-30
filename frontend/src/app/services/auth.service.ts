import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Response, User } from '../interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private serverUrl: string = '';

  constructor(
    private http: HttpClient,
  ) {}

  checkField(field: string, data: string): Observable<Response<any>> {
    return this.http.post<Response<any>>(
      `${this.serverUrl}/api/auth/check/${field}`,
      { [field]: data }
    );
  }

  register(data: string): Observable<Response<any>> {
    return this.http.post<Response<any>>(`${this.serverUrl}/api/auth/register`, data);
  }

  login(data: string): Observable<Response<any>> {
    return this.http.post<Response<any>>(`${this.serverUrl}/api/auth/login`, data);
  }

  loginGoogle(): void {
    window.location.href = `${this.serverUrl}/auth/google`;
  }

  logout(): Observable<Response<any>> {
    return this.http.post<Response<any>>(`${this.serverUrl}/api/auth/logout`, {});
  }

  profile(): Observable<Response<any>> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/user`);
  }

  changePassword(password: string): Observable<Response<any>> {
    return this.http.post<Response<any>>(`${this.serverUrl}/api/user/password`, { password });
  }

  updateAvatar(file: File): Observable<Response<User>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post<Response<User>>(
      `${this.serverUrl}/api/user/avatar`,
      formData
    );
  }
}
