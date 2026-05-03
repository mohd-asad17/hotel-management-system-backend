import z from 'zod';

export const reviewSchema = z.object({
    bookingId: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional()
})