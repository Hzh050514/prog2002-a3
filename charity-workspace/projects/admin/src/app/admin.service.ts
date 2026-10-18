/**
 * admin.service.ts
 * ---------------------------------------------------------------------------
 * Every call the ADMIN-SIDE website makes to the RESTful API.
 * Implements the full C.R.U.D. cycle built in Part 2 of the brief.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { ApiMessage, Category, CharityEvent, EventPayload } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** READ - GET /api/events */
  getEvents(): Observable<CharityEvent[]> {
    return this.http.get<CharityEvent[]>(`${this.baseUrl}/events`);
  }

  /** READ one - GET /api/events/:id (includes the registrations) */
  getEvent(id: number): Observable<CharityEvent> {
    return this.http.get<CharityEvent>(`${this.baseUrl}/events/${id}`);
  }

  /** CREATE - POST /api/events */
  createEvent(payload: EventPayload): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.baseUrl}/events`, payload);
  }

  /** UPDATE - PUT /api/events/:id */
  updateEvent(id: number, payload: Partial<EventPayload>): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${this.baseUrl}/events/${id}`, payload);
  }

  /**
   * DELETE - DELETE /api/events/:id
   * The API answers 409 when the event already has registrations.
   */
  deleteEvent(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.baseUrl}/events/${id}`);
  }

  /** GET /api/categories */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }
}
