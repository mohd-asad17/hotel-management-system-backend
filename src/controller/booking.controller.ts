import express from "express";
import { createBookingSchema } from "../ValidationSchema/booking.schema";
import { prisma } from "../../database/db.config";
import { nanoid } from "nanoid";
const router = express.Router();
const ROOM_NOT_AVAILABLE_ERROR = "ROOM_NOT_AVAILABLE";

router.post("/", async (req, res) => {
  const parseBookingData = createBookingSchema.safeParse(req.body);

  if (!parseBookingData.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  const { roomId, checkInDate, checkOutDate, guests } = parseBookingData.data;
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "UNAUTHORIZED",
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (checkIn <= today) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_DATES",
    });
  }

  if (checkOut <= checkIn) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_DATES",
    });
  }

  const rooms = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      hotel: true,
    },
  });

  if (!rooms) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "ROOM_NOT_FOUND",
    });
  }

  if (rooms?.hotel.ownerId === userId) {
    return res.status(403).json({
      success: false,
      data: null,
      error: "FORBIDDEN",
    });
  }

  const maxOccupancy = rooms?.maxOccupancy;
  if (maxOccupancy == null || maxOccupancy < guests) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_CAPACITY",
    });
  }

  let bookings;
  try {
    bookings = await prisma.$transaction(async (tx) => {
      const overlap = await tx.bookings.findFirst({
        where: {
          roomId,
          status: "CONFIRMED",
          AND: [
            { checkInDate: { lt: checkOut } },
            { checkOutDate: { gt: checkIn } },
          ],
        },
      });

      if (overlap) {
        throw new Error(ROOM_NOT_AVAILABLE_ERROR);
      }

      const nights =
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
      const totalPrice = nights * parseFloat(rooms.pricePerNight.toString());

      return tx.bookings.create({
        data: {
          id: `booking_${nanoid(10)}`,
          userId,
          roomId,
          hotelId: rooms.hotelId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests,
          totalPrice: totalPrice,
          status: "CONFIRMED",
        },
      });
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === ROOM_NOT_AVAILABLE_ERROR) {
      return res.status(400).json({
        success: false,
        data: null,
        error: ROOM_NOT_AVAILABLE_ERROR,
      });
    }
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_ERROR",
    });
  }

  return res.status(201).json({
    success: true,
    data: {
      id:           bookings.id,
      userId:       bookings.userId,                          
      roomId:       bookings.roomId,
      hotelId:      bookings.hotelId,
      checkInDate:  bookings.checkInDate.toISOString(),
      checkOutDate: bookings.checkOutDate.toISOString(),
      guests:       bookings.guests,
      totalPrice:   parseFloat(bookings.totalPrice.toString()), 
      status:       bookings.status,
      bookingDate:  bookings.bookingDate.toISOString(),
    },
    error: null,
  });
});

export default router;
