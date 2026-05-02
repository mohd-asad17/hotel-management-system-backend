import z from "zod";


export const hotelSchema = z.object({
    name: z.string(),
    description: z.string(),
    city: z.string(),
    country: z.string(),
    amenities: z.array(z.string()).default([]) 
});

export const roomSchema = z.object({
    roomNumber: z.number(),
    roomType: z.string(),
    pricePerNight: z.number(),
    maxOccupancy: z.number()
});

export const hotelQuerySchema = z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    minRating: z.string().optional()
});

