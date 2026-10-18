/**
 * Shared TypeScript models.
 * The shapes mirror the JSON produced by the Node.js / Express API.
 *
 * NOTE: MySQL returns DECIMAL columns as strings, which is why the funding
 * and coordinate fields are typed as `string | null` and converted with
 * Number() wherever arithmetic is needed.
 */

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

  /* Only present on GET /api/events/:id */
  registrations?: Registration[];
  total_tickets?: number;
}

/** One day of the Open-Meteo forecast returned by GET /api/weather. */
export interface WeatherDay {
  date: string;
  weather_code: number;
  description: string;
  temperature_max: number;
  temperature_min: number;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  forecast: WeatherDay[];
}
