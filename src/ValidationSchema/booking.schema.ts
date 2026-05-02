import { z } from "zod";

export const createBookingSchema = z.object({
  roomId: z.string(),
  checkInDate: z.iso.date(),
  checkOutDate: z.iso.date(),
  guests: z.number().int().positive(),
});