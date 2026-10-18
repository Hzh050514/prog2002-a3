import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminService } from '../admin.service';
import { CharityEvent } from '../models';
import { formatCurrency, formatDate, statusClass } from '../utils';

@Component({
  selector: 'app-events-list',
  imports: [RouterLink],
  templateUrl: './events-list.html',
})
export class EventsList {
  private readonly adminService = inject(AdminService);

  /** Every event, regardless of status (Active / Past / Suspended). */
  readonly events = signal<CharityEvent[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');

  /** Id of the row whose deletion is waiting for confirmation. */
  readonly pendingDelete = signal<number | null>(null);
  readonly deleting = signal<number | null>(null);

  protected readonly format = { currency: formatCurrency, date: formatDate, statusClass };

  constructor() {
    this.load();
  }

  /** LIST feature - GET /api/events */
  load(): void {
    this.loading.set(true);
    this.adminService.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the events from the API.');
        this.loading.set(false);
      },
    });
  }

  countBy(status: string): number {
    return this.events().filter((event) => event.status === status).length;
  }

  /** Step 1 of the DELETE feature: ask the staff member to confirm. */
  confirmDelete(id: number): void {
    this.pendingDelete.set(id);
    this.error.set('');
    this.message.set('');
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  /**
   * DELETE feature - DELETE /api/events/:id
   * The API blocks the deletion (HTTP 409) when the event has registrations;
   * that message is surfaced here so the staff member understands why.
   */
  deleteEvent(id: number): void {
    this.deleting.set(id);
    this.adminService.deleteEvent(id).subscribe({
      next: () => {
        this.message.set(`Event ${id} was deleted successfully.`);
        this.pendingDelete.set(null);
        this.deleting.set(null);
        this.load();
      },
      error: (err) => {
        this.error.set(
          err?.error?.error || `Event ${id} could not be deleted. Please try again.`
        );
        this.pendingDelete.set(null);
        this.deleting.set(null);
      },
    });
  }
}
