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
