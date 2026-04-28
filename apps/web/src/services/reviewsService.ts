import type { PaginatedResponse } from '@convoca/shared';
import type { ReviewWithAuthor } from '@/types';
import { api } from './api';

export type CreateReviewData = {
  eventId: string;
  rating: number;
  comment: string;
};

export const reviewsService = {
  create: async (data: CreateReviewData): Promise<ReviewWithAuthor> => {
    const res = await api.post<{ data: ReviewWithAuthor }>('/api/reviews', data);
    return res.data;
  },

  byEvent: (eventId: string, page = 1, limit = 5): Promise<PaginatedResponse<ReviewWithAuthor>> =>
    api.get<PaginatedResponse<ReviewWithAuthor>>(
      `/api/reviews/event/${eventId}?page=${page}&limit=${limit}`
    ),

  remove: (id: string): Promise<void> => api.delete(`/api/reviews/${id}`),
};
