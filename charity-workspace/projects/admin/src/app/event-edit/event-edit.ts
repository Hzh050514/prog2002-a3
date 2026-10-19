/**
 * event-edit.ts - administrator "update event" form (UPDATE).
 * ---------------------------------------------------------------------------
 * The form is pre-filled from GET /api/events/:id, including the coordinates
 * used by the weather feature and the registrations already recorded.
 *
 * Saving sends PUT /api/events/:id and then reloads the record, so the page
 * always shows what the database currently contains.
 */
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminService } from '../admin.service';
import { Category, CharityEvent } from '../models';
import { formatCurrency, formatDateTime, statusClass, toDateInput } from '../utils';

@Component({
  selector: 'app-event-edit',
  imports: [FormsModule, RouterLink],
  templateUrl: './event-edit.html',
})
export class EventEdit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  readonly event = signal<CharityEvent | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly error = signal('');
  readonly message = signal('');
  readonly errors = signal<Record<string, string>>({});
  readonly submitting = signal(false);

  protected readonly statuses = ['Active', 'Past', 'Suspended'];
  protected readonly format = {
    currency: formatCurrency,
    dateTime: formatDateTime,
    statusClass,
  };

  /** ngModel bound form, pre-filled from GET /api/events/:id */
  form = {
    event_name: '',
    event_description: '',
    event_date: '',
    event_location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    organiser_name: '',
    contact_email: '',
    contact_phone: '',
    category_id: null as number | null,
    status: 'Active',
    target_funding: 0,
    current_funding: 0,
  };

  constructor() {
    this.adminService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadEvent(id);
      }
    });
  }

  /** UPDATE feature - load the current record AND its registrations. */
  private loadEvent(id: number): void {
    this.loading.set(true);
    this.adminService.getEvent(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.form = {
          event_name: event.event_name,
          event_description: event.event_description ?? '',
          event_date: toDateInput(event.event_date),
          event_location: event.event_location,
          latitude: event.latitude === null ? null : Number(event.latitude),
          longitude: event.longitude === null ? null : Number(event.longitude),
          organiser_name: event.organiser_name,
          contact_email: event.contact_email ?? '',
          contact_phone: event.contact_phone ?? '',
          category_id: event.category_id,
          status: event.status,
          target_funding: Number(event.target_funding ?? 0),
          current_funding: Number(event.current_funding ?? 0),
        };
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load this event.');
        this.loading.set(false);
      },
    });
  }

  private validate(): boolean {
    const found: Record<string, string> = {};

    if (!this.form.event_name.trim()) {
      found['event_name'] = 'Event name is required.';
    }
    if (!this.form.event_date) {
      found['event_date'] = 'Event date is required.';
    }
    if (!this.form.event_location.trim()) {
      found['event_location'] = 'Location is required.';
    }
    if (!this.form.organiser_name.trim()) {
      found['organiser_name'] = 'Organiser name is required.';
    }
    if (!this.form.category_id) {
      found['category_id'] = 'Please select a category.';
    }
    if (this.form.latitude !== null && (this.form.latitude < -90 || this.form.latitude > 90)) {
      found['latitude'] = 'Latitude must be between -90 and 90.';
    }
    if (this.form.longitude !== null && (this.form.longitude < -180 || this.form.longitude > 180)) {
      found['longitude'] = 'Longitude must be between -180 and 180.';
    }

    this.errors.set(found);
    return Object.keys(found).length === 0;
  }

  /** UPDATE feature - PUT /api/events/:id */
  save(): void {
    const event = this.event();
    if (!event) {
      return;
    }

    if (!this.validate()) {
      this.error.set('Please fix the highlighted fields before saving.');
      return;
    }

    this.error.set('');
    this.message.set('');
    this.submitting.set(true);

    this.adminService.updateEvent(event.event_id, { ...this.form }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.message.set('Event updated successfully.');
        this.loadEvent(event.event_id);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'The event could not be updated.');
      },
    });
  }
}
