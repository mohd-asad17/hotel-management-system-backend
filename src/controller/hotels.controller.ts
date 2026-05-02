import express from 'express';
import { hotelSchema, roomSchema } from '../ValidationSchema/hotels.schema';
import { prisma } from '../../database/db.config';
const router = express.Router();


router.post('/',async (req, res) => {
    const hotelParsedData = hotelSchema.safeParse(req.body);

    if(!hotelParsedData.success) {
        return res.status(400).json({
            success: false,
            data: null, 
            error: "INVALID_REQUEST"
        });
    }

    const {name, description, city, country, amenities} = hotelParsedData.data;
    const ownerId = req.user?.id;
    if (!ownerId) {
        return res.status(401).json({
            success: false,
            data: null,
            error: "UNAUTHORIZED"
        });
    }

    const hotel = await prisma.hotels.create({
        data: {
            ownerId,
          name,
          description,
          city,
          country,
          amenities,
        },
      });

      return res.status(201).json({
        success: true,
        data:{
            id: hotel.id,
            ownerId: hotel.ownerId,
            name: hotel.name,
            description: hotel.name,
            city: hotel.city,
            country: hotel.country,
            amenities: hotel.amenities,
            rating: hotel.rating,
            totalReviews: hotel.totalReviews
        },
        error: null
      });
});


router.post('/:hotelId/rooms', async (req, res) => {
    const parsedRoomData = roomSchema.safeParse(req.body);

    if(!parsedRoomData.success){
        return res.status(400).json({
            success: false,
            data: null, 
            error: "INVALID_REQUEST"
        });
    }

    const { hotelId } = req.params;
    const {roomNumber, roomType, pricePerNight, maxOccupancy} = parsedRoomData.data;
    const ownerId = req.user?.id;

    const checkHotel = await prisma.hotels.findUnique({ where: { id: hotelId } });
    if (!checkHotel) {
      return res.status(404).json({
         success: false, 
         data: null, 
         error: "HOTEL_NOT_FOUND" 
        });
    }

    if(checkHotel.ownerId !== ownerId) {
        return res.status(403).json({
            success: false, 
            data: null,
            error: "FORBIDDEN"
        })
    }
    

    const existingRoom = await prisma.room.findUnique({
        where: {
            hotelId_roomNumber: {
                hotelId, 
                roomNumber
            }
        }
    });

    if(existingRoom) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "ROOM_ALREADY_EXISTS"
        });
    }

    const rooms = await prisma.room.create({
        data: {
            hotelId,
            roomNumber,
            roomType,
            pricePerNight,
            maxOccupancy
        }
    });

    return res.status(201).json({
        success: true,
        data: {
            id: rooms.id,
            hotelId: rooms.hotelId,
            roomNumber: rooms.roomNumber,
            roomType: rooms.roomType,
            pricePerNight: rooms.pricePerNight,
            maxOccupancy: rooms.maxOccupancy
        },
        error: null
    });
});


export default router;