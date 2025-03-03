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

export { app };
