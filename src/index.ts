import "dotenv/config";
import express from 'express';
import cors  from 'cors';
import  userRouter  from './routes/userRouter'
import hotelRouter from './routes/hotelRoute';
import bookingRouter from './routes/bookingRoute';
const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', userRouter);
app.use('/api', hotelRouter);
app.use('/api', bookingRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});