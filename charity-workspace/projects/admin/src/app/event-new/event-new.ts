/**
 * event-new.ts - administrator "create event" form (CREATE).
 * ---------------------------------------------------------------------------
 * Categories come from GET /api/categories so the drop-down always matches the
 * database. Required fields, latitude/longitude ranges and non-negative funding
 * amounts are validated before POST /api/events is sent.
 *
 * After a successful save the user returns to the list, which reloads from the
 * API so the new row appears immediately.
 */
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminService } from '../admin.service';
import { Category } from '../models';

@Component({
  selector: 'app-event-new',
  imports: [FormsModule, RouterLink],
  templateUrl: './event-new.html',
})
export class EventNew {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly errors = signal<Record<string, string>>({});
  readonly error = signal('');
  readonly submitting = signal(false);

  protected readonly statuses = ['Active', 'Past', 'Suspended'];

  /** ngModel bound form - mirrors the `events` table columns. */
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
  }

  /** Validation: the essential fields must be filled in before the API call. */
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
    if (Number(this.form.target_funding) < 0 || Number(this.form.current_funding) < 0) {
      found['target_funding'] = 'Funding amounts cannot be negative.';
    }

    this.errors.set(found);
    return Object.keys(found).length === 0;
  }

  /** NEW feature - POST /api/events */
  submit(): void {
    if (!this.validate()) {
      this.error.set('Please fix the highlighted fields before saving.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);

    this.adminService.createEvent({ ...this.form, category_id: this.form.category_id as number })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/events']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.error?.error || 'The event could not be created.');
        },
      });
  }
}
