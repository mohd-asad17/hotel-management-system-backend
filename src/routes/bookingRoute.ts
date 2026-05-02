import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import bookingRoutes from '../controller/booking.controller';
const router = express.Router();


router.use(authMiddleware);

router.use('/bookings', roleMiddleware('CUSTOMER'), bookingRoutes);

export default router;