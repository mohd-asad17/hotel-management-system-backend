import express from "express";
import { bookingQuerySchema, createBookingSchema } from "../ValidationSchema/booking.schema";
import { prisma } from "../../database/db.config";
import { nanoid } from "nanoid";
import { reviewSchema } from "../ValidationSchema/reviews.schema";
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

router.get('/', async (req, res) => {
    const parseStatus = bookingQuerySchema.safeParse(req.query);

    if(!parseStatus.success){
        return res.status(400).json({
            success: false,
            data: null,
            error:"INVALID_REQUEST"
        });
    }

    const userId = req.user?.id;
    const status = parseStatus.data;
    const bookings = await prisma.bookings.findMany({
        where: {
            userId,
            ...(status ? {status}: {}) 
        },
        include: {
            room: {
                select: {
                    roomNumber: true,
                    roomType: true
                }
            },
            hotel: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            bookingDate: 'desc'
        }
    });

    const bookingData = bookings.map((b) => ({
        id:           b.id,
        roomId:       b.roomId,
        hotelId:      b.hotelId,
        hotelName:    b.hotel.name,
        roomNumber:   b.room.roomNumber,
        roomType:     b.room.roomType,
        checkInDate:  b.checkInDate.toISOString(),
        checkOutDate: b.checkOutDate.toISOString(),
        guests:       b.guests,
        totalPrice:   parseFloat(b.totalPrice.toString()),
        status:       b.status,
        bookingDate:  b.bookingDate.toISOString(),
      }));

      return res.status(201).json({
        success: true,
        data: bookingData,
        error: null
      })
})

router.put('/:bookingId/cancel', async (req, res) => {
    const {bookingId} = req.params;
    const userId = req.user?.id;
    if(!userId) {
        return res.status(401).json({
            success: false,
            data: null,
            error:"UNAUTHORIZED"
        });
    }
    const booking = await prisma.bookings.findFirst({
        where: {
            id: bookingId
        }
    });

    if(!booking) {
        return res.status(404).json({
            success: false,
            data: null,
            error: "BOOKING_NOT_FOUND"
        });
    }

    if(booking.userId !== userId) {
        return res.status(403).json({
            success: false,
             data: null,
             error: "FORBIDDEN"
        });
    }

    if(booking.status === 'CANCELLED'){
        return res.status(400).json({
            succcess: false,
            data: null,
            error: "ALREADY_CANCELLED"
        });
    }

    const now = new Date();
    const checkIn = new Date(booking.checkInDate);

    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) /(1000 * 60 * 60);
    
    if(hoursUntilCheckIn < 24) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "CANCELLATION_DEADLINE_PASSED"
        });
    }

    const cancelBooking = await prisma.bookings.update({
        where: { id: bookingId },
        data: { status: "CANCELLED",
            cancelledAt: new Date(),
         },
      });

      return res.status(200).json({
        success: true,
        data: {
            id: cancelBooking.id,
            status: cancelBooking.status,
            cancelledAt: cancelBooking.cancelledAt?.toISOString()
        },
        error: null
      });
});

router.post('/reviews', async (req, res) => {
  const parseReviewData = reviewSchema.safeParse(req.body);
  const userId = req.user?.id;

  if(!parseReviewData.success){
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST"
    });
  }

  if(!userId) {
    return res.status(401).json({
        success: false,
        data: null,
        error:"UNAUTHORIZED"
    });
}

const { bookingId, rating, comment} = parseReviewData.data;

const booking = await prisma.bookings.findFirst({
  where: {
    id: bookingId
  }
});

if(!booking) {
  return res.status(404).json({
      success: false,
      data: null,
      error: "BOOKING_NOT_FOUND"
  });
}

if(booking.userId !== userId) {
  return res.status(403).json({
    success: false,
    data: null,
    error: "FORBIDDEN"
  });
}

const today = new Date();
today.setHours(0,0,0,0);

const checkOut = new Date(booking.checkOutDate);

const isEligible = checkOut < today && booking.status === 'CONFIRMED';

if(!isEligible){
  return res.status(400).json({
    success: false,
    data: null,
    error: "BOOKING_NOT_ELIGIBLE"
  });
}

const existingReview = await prisma.review.findUnique({
  where: {
    userId_bookingId: {
      userId,
      bookingId
    }
  }
});

if(existingReview){
  return res.status(400).json({
    success: false,
    data: null,
    error: "ALREADY_REVIEW"
  });
}

const review = await prisma.$transaction(async (tx) => {
  const newReview = await tx.review.create({
    data: {
      id: `review_${nanoid(10)}`,
      userId,
      hotelId: booking.hotelId,
      bookingId,
      rating,
      comment
    },
  });

  const hotel = await tx.hotels.findUnique({
    where: {
      id: booking.hotelId
    },
    select: {
      totalReviews: true,
      rating: true
    }
  });

  if(!hotel){
    throw new Error("HOTEL_NOT_FOUND");
  }

  const newRating = ((parseFloat(hotel.rating.toString())  * hotel.totalReviews) + rating)/ (hotel.totalReviews + 1);

  await tx.hotels.update({
    where: {
      id: booking.hotelId
    },
    data: {
      rating: parseFloat(newRating.toFixed(1)),
      totalReviews: hotel.totalReviews + 1,
    },
  });

  return newReview;
});

return res.status(200).json({
  success: true,
  data: {
    id: review.id,
    userId: review.userId,
    hotelId: review.hotelId,
    bookingId: review.bookingId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt
  },
  error: null
});
});

export default router;
