import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});