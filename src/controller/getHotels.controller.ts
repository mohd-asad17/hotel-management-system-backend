import express from 'express';
import { hotelQuerySchema } from '../ValidationSchema/hotels.schema';
import { prisma } from '../../database/db.config';
const router = express.Router();

router.get('/', async (req, res ) => {
    const parsedhotelQueryData = hotelQuerySchema.safeParse(req.query);

    if(!parsedhotelQueryData.success){
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_REQUEST"
        });
    }

    const {city, country, minPrice, maxPrice, minRating} = parsedhotelQueryData.data;
    
    const findHotelWithQuery: Record<string, any> = {};
    if(city) {
        findHotelWithQuery.city = {contains: city, mode: "insensitive"}
    }
    if(country)  {
        findHotelWithQuery.country = {
            contains: country, 
            mode: "insensitive"
        }
    }
    if(minRating !== undefined) {
        findHotelWithQuery.minRating = {
            gte: minRating, 
        }
    }

    const hotels = await prisma.hotels.findMany({
        where: findHotelWithQuery,
        include: {
            rooms : {
                select : {
                    pricePerNight: true
                }
            }
        }
    });

    const result = hotels.filter((hotel) => {
        hotel.rooms.length > 0;
    }).map((hotel) => {
        const minPricePerNight = Math.min(
            ...hotel.rooms.map((r) => parseFloat(r.pricePerNight.toString()))
        );
        return {hotel, minPricePerNight}
    })
    .filter(({minPricePerNight}) => {
        if(minPrice !== undefined && minPrice > minPricePerNight) return false;
        if(maxPrice !== undefined && maxPrice < minPricePerNight) return false;
        return true;
    })
    .map(({hotel, minPricePerNight}) => ({
        id: hotel.id,
        name: hotel.name,
        description: hotel.description ?? null,
        city: hotel.city,
        country: hotel.country,
        amenities: hotel.amenities,
        rating: hotel.rating,
        totalReviews: hotel.totalReviews,
        minPricePerNight
    }))

    return res.status(201).json({
        success: true,
        data: result,
        error: null
    });
});

router.get('/:hotelId', async (req, res) => {
    const { hotelId } =  req.params;

    const hotel = await prisma.hotels.findUnique({
        where: {
            id: hotelId
        },
        include: {
            rooms: true
        }
    });

    if(!hotel){
        return res.status(400).json({
            success: true,
            data: null,
            error: "HOTEL_NOT_FOUND"
        });
    }
    return res.status(200).json({
        success: true,
        data: {
            id: hotel.id,
            ownerId: hotel.ownerId,
            name: hotel.name,
            description: hotel.description,
            city: hotel.city,
            country: hotel.country,
            amenities: hotel.amenities,
            rating: hotel.rating,
            totalReviews: hotel.totalReviews,
            rooms: hotel.rooms.map((r) => ({
                id: r.id,
                roomNumber: r.roomNumber,
                roomType: r.roomType,
                pricePerNight: r.pricePerNight,
                maxOccupancy: r.maxOccupancy
            })),
        },
        error: null
    });
});




export default router;