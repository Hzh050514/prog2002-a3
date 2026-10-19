/**
 * registration.ts - client-side Registration form (/register/:id).
 * ---------------------------------------------------------------------------
 * Flow: validate in the browser -> POST /api/registrations -> confirmation
 * message -> redirect to the event detail page after a short delay.
 *
 * Browser validation stops obvious mistakes before a request is sent, but the
 * server rules still apply: the UNIQUE(event_id, email) constraint makes the
 * API answer 409, and that message is displayed to the visitor unchanged.
 */
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CharityEvent } from '../models';
import { EventService } from '../event.service';
import { formatCurrency, formatDate } from '../utils';

@Component({
  selector: 'app-registration',
  imports: [FormsModule, RouterLink],
  templateUrl: './registration.html',
})
export class Registration {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  readonly event = signal<CharityEvent | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  /** Field level validation messages. */
  readonly errors = signal<Record<string, string>>({});
  readonly submitting = signal(false);
  readonly successMessage = signal('');

  /** ngModel bound form. */
  form = {
    name: '',
    email: '',
    phone: '',
    number_of_tickets: 1,
  };

  protected readonly format = { currency: formatCurrency, date: formatDate };
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadEvent(id);
      }
    });
  }

  /** Loads the selected event so the user can see what they register for. */
  private loadEvent(id: number): void {
    this.loading.set(true);
    this.eventService.getEvent(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the event you are trying to register for.');
        this.loading.set(false);
      },
    });
  }

  /** Client-side validation, run before any request is sent. */
  private validate(): boolean {
    const found: Record<string, string> = {};

    if (!this.form.name.trim()) {
      found['name'] = 'Please enter your full name.';
    }
    if (!this.form.email.trim()) {
      found['email'] = 'Please enter your email address.';
    } else if (!this.emailPattern.test(this.form.email.trim())) {
      found['email'] = 'Please enter a valid email address (e.g. name@example.com).';
    }

    const tickets = Number(this.form.number_of_tickets);
    if (!Number.isInteger(tickets) || tickets < 1) {
      found['number_of_tickets'] = 'The number of tickets must be a whole number of 1 or more.';
    }

    this.errors.set(found);
    return Object.keys(found).length === 0;
  }

  /** Finalise the registration: validate -> POST -> confirm -> navigate. */
  submit(): void {
    const event = this.event();
    if (!event) {
      return;
    }

    if (!this.validate()) {
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    this.eventService
      .createRegistration({
        event_id: event.event_id,
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        number_of_tickets: Number(this.form.number_of_tickets),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set(
            `Thank you ${this.form.name.trim()}, your registration for ` +
              `"${event.event_name}" has been recorded.`
          );
          // Give the user time to read the confirmation, then continue.
          setTimeout(() => this.router.navigate(['/event', event.event_id]), 2500);
        },
        error: (err) => {
          this.submitting.set(false);
          const serverMessage = err?.error?.error;
          this.error.set(
            serverMessage || 'The registration could not be saved. Please try again.'
          );
        },
      });
  }
}
