/**
 * event-detail.ts - client-side Event detail page (/event/:id).
 * ---------------------------------------------------------------------------
 * Two API calls are made for one page:
 *   1. GET /api/events/:id  - the event plus every registration for it.
 *   2. GET /api/weather     - seven day forecast for the event coordinates
 *                             (our Express server proxies api.open-meteo.com).
 *
 * Registrations are sorted newest-first on the client as well, so the order
 * required by the brief is guaranteed even if the SQL ordering changes.
 */
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { CharityEvent, Registration, WeatherDay } from '../models';
import { EventService } from '../event.service';
import { WeatherService } from '../weather.service';
import { formatCurrency, formatDate, formatDateTime, fundingProgress, statusClass } from '../utils';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink],
  templateUrl: './event-detail.html',
})
export class EventDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly weatherService = inject(WeatherService);

  readonly event = signal<CharityEvent | null>(null);
  readonly forecast = signal<WeatherDay[]>([]);
  readonly weatherError = signal('');
  readonly loading = signal(true);
  readonly error = signal('');

  protected readonly format = {
    currency: formatCurrency,
    date: formatDate,
    dateTime: formatDateTime,
    progress: fundingProgress,
    statusClass,
  };

  constructor() {
    // Re-run whenever the :id route parameter changes.
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadEvent(id);
      }
    });
  }

  /** GET /api/events/:id - event details + every registration for it. */
  private loadEvent(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.eventService.getEvent(id).subscribe({
      next: (event) => {
        // The API already returns registrations newest-first; sorting again
        // guarantees the order required by the brief even if the data changes.
        const registrations = [...(event.registrations ?? [])].sort(
          (a, b) =>
            new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime()
        );

        this.event.set({ ...event, registrations });
        this.loading.set(false);
        this.loadWeather(event);
      },
      error: () => {
        this.error.set('Could not load this event. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  /**
   * External API (Part 6): 7 day forecast for the event location,
   * fetched through GET /api/weather on our own server.
   */
  private loadWeather(event: CharityEvent): void {
    if (event.latitude === null || event.longitude === null) {
      this.weatherError.set('No coordinates are stored for this event.');
      return;
    }

    this.weatherService.getForecast(Number(event.latitude), Number(event.longitude)).subscribe({
      next: (data) => this.forecast.set(data.forecast ?? []),
      error: () => this.weatherError.set('Weather forecast is temporarily unavailable.'),
    });
  }

  /** Total tickets already purchased for this event. */
  totalTickets(): number {
    return (this.event()?.registrations ?? []).reduce(
      (sum: number, r: Registration) => sum + Number(r.number_of_tickets),
      0
    );
  }
}
