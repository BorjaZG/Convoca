export type Role = 'USER' | 'ORGANIZER' | 'ADMIN';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface EventWithOrganizer extends Event {
  organizer: SafeUser;
  averageRating?: number | null;
  availableCapacity?: number;
  _count?: {
    reservations: number;
    reviews: number;
  };
}

export interface UserStats {
  totalReservations: number;
  eventsAttended: number;
  upcomingEvents: number;
}

export interface OrganizerStats {
  activeEvents: number;
  totalReservations: number;
  totalRevenue: number;
  averageRating: number | null;
  eventsByCategory: { category: Category; count: number }[];
  reservationsByMonth: { month: string; count: number }[];
}

export interface AdminStats {
  totalUsers: number;
  publishedEvents: number;
  totalReservations: number;
  totalRevenue: number;
  eventsByMonth: { month: string; count: number }[];
  categoryDistribution: { category: Category; count: number }[];
  topOrganizers: { id: string; name: string; totalEvents: number; totalRevenue: number }[];
}

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
  imagePublicId?: string;
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
