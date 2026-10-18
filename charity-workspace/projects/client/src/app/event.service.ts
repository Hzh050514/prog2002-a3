/**
 * event.service.ts
 * ---------------------------------------------------------------------------
 * Every call the CLIENT-SIDE website makes to the RESTful API lives here.
 * Components never talk to HttpClient directly, which keeps the API base URL
 * in exactly one place.
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { Category, CharityEvent, Registration } from './models';

/** Optional filters accepted by GET /api/events */
export interface EventFilters {
  q?: string;
  category_id?: number | null;
  status?: string | null;
  location?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** GET /api/events - used by the Home page and by the Search page. */
  getEvents(filters: EventFilters = {}): Observable<CharityEvent[]> {
    let params = new HttpParams();

    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.category_id) {
      params = params.set('category_id', filters.category_id);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.location) {
      params = params.set('location', filters.location);
    }

    return this.http.get<CharityEvent[]>(`${this.baseUrl}/events`, { params });
  }

  /**
   * GET /api/events/:id
   * Returns the event AND every registration recorded for it.
   */
  getEvent(id: number): Observable<CharityEvent> {
    return this.http.get<CharityEvent>(`${this.baseUrl}/events/${id}`);
  }

  /** GET /api/categories - fills the search drop-down. */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  /** POST /api/registrations - the Register page submission. */
  createRegistration(payload: {
    event_id: number;
    name: string;
    email: string;
    phone: string;
    number_of_tickets: number;
  }): Observable<{ message: string; registration_id: number }> {
    return this.http.post<{ message: string; registration_id: number }>(
      `${this.baseUrl}/registrations`,
      payload
    );
  }

  /** GET /api/registrations?event_id= - handy cross-check for the detail page. */
  getRegistrations(eventId: number): Observable<Registration[]> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<Registration[]>(`${this.baseUrl}/registrations`, { params });
  }
}
