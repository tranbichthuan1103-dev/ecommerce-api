import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// 1. Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. API Routes
app.use('/api', apiRoutes);

// 3. 404 Not Found Handler (cho các đường dẫn không tồn tại)
app.use(notFoundHandler);

// 4. Global Error Handler (xử lý lỗi tập trung)
app.use(errorHandler);

export default app;

