export type Role = 'USER' | 'ORGANIZER' | 'ADMIN';

export type Category =
  | 'CONCIERTO'
  | 'EXPOSICION'
  | 'TALLER'
  | 'MERCADILLO'
  | 'TEATRO'
  | 'CONFERENCIA'
  | 'GASTRONOMIA'
  | 'DEPORTE';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: Category;
  startDate: Date;
  endDate: Date;
  venue: string;
  city: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  price: number;
  imageUrl?: string;
  status: EventStatus;
  featured: boolean;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  quantity: number;
  totalPrice: number;
  status: ReservationStatus;
  userId: string;
  eventId: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  eventId: string;
  createdAt: Date;
}
