import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Category, CharityEvent } from '../models';
import { EventService } from '../event.service';
import { formatCurrency, formatDate, fundingProgress, statusClass } from '../utils';

@Component({
  selector: 'app-search',
  imports: [FormsModule, RouterLink],
  templateUrl: './search.html',
})
export class Search {
  private readonly eventService = inject(EventService);

  readonly categories = signal<Category[]>([]);
  readonly events = signal<CharityEvent[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  /** Client-side validation message (no criterion selected). */
  readonly validationError = signal('');
  readonly hasSearched = signal(false);

  /** ngModel bound filter form. */
  filters = {
    q: '',
    category_id: null as number | null,
    status: null as string | null,
    location: '',
  };

  protected readonly statuses = ['Active', 'Past', 'Suspended'];
  protected readonly format = {
    currency: formatCurrency,
    date: formatDate,
    progress: fundingProgress,
    statusClass,
  };

  constructor() {
    this.eventService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }

  /**
   * Runs the search.
   * Validation: at least one criterion must be supplied, otherwise the user is
   * told what to do instead of silently loading the whole table.
   */
  search(): void {
    const { q, category_id, status, location } = this.filters;

    if (!q.trim() && !category_id && !status && !location.trim()) {
      this.validationError.set('Please enter at least one search criterion before searching.');
      this.events.set([]);
      this.hasSearched.set(false);
      return;
    }

    this.validationError.set('');
    this.error.set('');
    this.loading.set(true);
    this.hasSearched.set(true);

    this.eventService
      .getEvents({
        q: q.trim() || undefined,
        category_id: category_id ?? undefined,
        status: status ?? undefined,
        location: location.trim() || undefined,
      })
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('The search could not be completed. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /** Clears the form and reloads the complete list of events. */
  reset(): void {
    this.filters = { q: '', category_id: null, status: null, location: '' };
    this.validationError.set('');
    this.error.set('');
    this.hasSearched.set(true);
    this.loading.set(true);

    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the events.');
        this.loading.set(false);
      },
    });
  }
}
