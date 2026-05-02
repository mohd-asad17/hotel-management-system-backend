import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import hotelRoutes from '../controller/hotels.controller';
import getHotelsRoutes from '../controller/getHotels.controller'
import { roleMiddleware } from '../middleware/role.middleware';
const router = express.Router();

router.use(authMiddleware);


router.use('/hotels', roleMiddleware("OWNER"), hotelRoutes);
router.use('/hotels', getHotelsRoutes);
export default router;