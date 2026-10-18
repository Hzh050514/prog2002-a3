/** Shared TypeScript models (identical to the client app). */

export type EventStatus = 'Active' | 'Past' | 'Suspended';

export interface Category {
  category_id: number;
  name: string;
  description: string | null;
}

export interface Registration {
  registration_id: number;
  event_id: number;
  name: string;
  email: string;
  phone: string | null;
  number_of_tickets: number;
  registration_date: string;
}

export interface CharityEvent {
  event_id: number;
  event_name: string;
  event_description: string | null;
  event_date: string;
  event_location: string;
  latitude: string | null;
  longitude: string | null;
  organiser_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  category_id: number;
  category_name: string;
  status: EventStatus;
  target_funding: string;
  current_funding: string;
  registrations?: Registration[];
  total_tickets?: number;
}

/** Payload accepted by POST /api/events and PUT /api/events/:id */
export interface EventPayload {
  event_name: string;
  event_description: string;
  event_date: string;
  event_location: string;
  latitude: number | null;
  longitude: number | null;
  organiser_name: string;
  contact_email: string;
  contact_phone: string;
  category_id: number | null;
  status: string;
  target_funding: number;
  current_funding: number;
}

/** Uniform response shape returned by the write endpoints. */
export interface ApiMessage {
  message: string;
  event_id?: number;
}
