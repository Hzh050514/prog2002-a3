/**
 * Route table for the client-side website.
 * Each page is a standalone component; the :id parameter is read with
 * ActivatedRoute in the detail and registration pages.
 *
 * The wildcard route sends unknown URLs back to the home page, which also
 * covers a mistyped deep link.
 */
import { Routes } from '@angular/router';

import { Home } from './home/home';
import { Search } from './search/search';
import { EventDetail } from './event-detail/event-detail';
import { Registration } from './registration/registration';

export const routes: Routes = [
  { path: '', component: Home, title: 'Charity Events - Home' },
  { path: 'search', component: Search, title: 'Charity Events - Search' },
  { path: 'event/:id', component: EventDetail, title: 'Charity Events - Event details' },
  { path: 'register/:id', component: Registration, title: 'Charity Events - Register' },
  { path: '**', redirectTo: '' },
];
