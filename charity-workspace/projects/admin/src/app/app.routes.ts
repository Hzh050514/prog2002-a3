import { Routes } from '@angular/router';

import { EventsList } from './events-list/events-list';
import { EventNew } from './event-new/event-new';
import { EventEdit } from './event-edit/event-edit';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  { path: 'events', component: EventsList, title: 'Admin - Events' },
  { path: 'events/new', component: EventNew, title: 'Admin - New event' },
  { path: 'events/:id/edit', component: EventEdit, title: 'Admin - Update event' },
  { path: '**', redirectTo: 'events' },
];
