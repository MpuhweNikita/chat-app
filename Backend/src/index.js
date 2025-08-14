import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import dotenv from 'dotenv';
import {connectDB} from "./lib/db.js"
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

dotenv.config();

const port = process.env.PORT || 5001;


app.use(express.json());
app.use('/api/auth', authRoutes)
app.use('/api/message', messageRoutes)
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173', // Adjust this to your frontend URL
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));

app.listen(5001, () => {
    console.log('Server is running on port 5001');
    connectDB()
    });