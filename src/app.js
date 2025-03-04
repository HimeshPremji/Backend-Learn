import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const limitSizeUpTo = '16kb';

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json({ limit: limitSizeUpTo }));
app.use(express.urlencoded({ extended: true, limit: limitSizeUpTo }));
app.use(express.static('public'));
app.use(cookieParser());

// here we have routes
// Routes imports
import userRoute from './routes/user.routes.js';

// Routes Declaration
app.use('/api/v1/users', userRoute);

export default app;
