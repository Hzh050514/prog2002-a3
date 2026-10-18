import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CharityEvent } from '../models';
import { EventService } from '../event.service';
import { formatCurrency, formatDate, fundingProgress, statusClass } from '../utils';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  private readonly eventService = inject(EventService);

  /** All events returned by GET /api/events. */
  readonly events = signal<CharityEvent[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  /** Template helpers. */
  protected readonly format = {
    currency: formatCurrency,
    date: formatDate,
    progress: fundingProgress,
    statusClass,
  };

  constructor() {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the events from the API. Please make sure the API server is running.');
        this.loading.set(false);
      },
    });
  }
}
