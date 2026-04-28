import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Diary, Response } from '../interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})
export class DiaryService {
  private serverUrl: string = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getDiariesFromTrip(tripId: number): Observable<Diary[]> {
    return this.http.get<{ data: Diary[] }>(`${this.serverUrl}/api/trip/${tripId}/diaries`)
      .pipe(map(response => response.data));
  }

  createDiary(tripId: number, formData: FormData): Observable<Response<Diary>> {
    return this.http.post<Response<Diary>>(`${this.serverUrl}/api/trip/${tripId}/diaries`, formData);
  }

  updateDiary(tripId: number, diaryId: number, formData: FormData): Observable<Response<Diary>> {
    // Laravel no parsea archivos en PUT multipart; usamos POST con _method=PUT (method spoofing)
    formData.append('_method', 'PUT');
    return this.http.post<Response<Diary>>(
      `${this.serverUrl}/api/trip/${tripId}/diaries/${diaryId}`,
      formData
    );
  }

  deleteDiary(tripId: number, diaryId: number): Observable<Response<void>> {
    return this.http.delete<Response<void>>(`${this.serverUrl}/api/trip/${tripId}/diaries/${diaryId}`);
  }
} 