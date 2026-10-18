/**
 * weather.service.ts
 * ---------------------------------------------------------------------------
 * External API integration (Part 6 of the brief).
 * Calls the Node.js weather proxy, which in turn queries the free
 * Open-Meteo service (https://api.open-meteo.com).
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { WeatherForecast } from './models';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** GET /api/weather?latitude=&longitude= */
  getForecast(latitude: number, longitude: number): Observable<WeatherForecast> {
    const params = new HttpParams()
      .set('latitude', String(latitude))
      .set('longitude', String(longitude));

    return this.http.get<WeatherForecast>(`${this.baseUrl}/weather`, { params });
  }
}
