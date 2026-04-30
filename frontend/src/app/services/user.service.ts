import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Response } from '../interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private serverUrl: string = '';

  constructor(
    private http: HttpClient,
  ) { }

  profile(): Observable<Response<any>> {
    return this.http.get<Response<any>>(`${this.serverUrl}/api/user`);
  }

  updateProfile(data: any): Observable<Response<any>> {
    return this.http.put<Response<any>>(`${this.serverUrl}/api/user`, data);
  }

  searchUsers(query: string, tripId: number): Observable<any> {
    return this.http.get<any>(`${this.serverUrl}/api/user/${tripId}/search`, {
      params: { query }
    });
  }
}
