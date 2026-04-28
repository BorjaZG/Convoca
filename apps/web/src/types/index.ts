import type { Event, Reservation, Review, SafeUser } from '@convoca/shared';

export interface ReservationWithEvent extends Reservation {
  event: Pick<Event, 'id' | 'title' | 'startDate' | 'venue' | 'city'> & {
    imageUrl?: string | null;
  };
}

export interface ReviewWithAuthor extends Review {
  user: Pick<SafeUser, 'id' | 'name' | 'avatarUrl'>;
}
