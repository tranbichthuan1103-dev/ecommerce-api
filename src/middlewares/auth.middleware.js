import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';

export const authenticateJWT = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Chưa xác thực: Vui lòng cung cấp token theo định dạng Authorization: Bearer <token>.',
        401
      );
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      throw new AppError('Chưa xác thực: Token không được để trống.', 401);
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    if (!decoded || !decoded.uid) {
      throw new AppError('Token không hợp lệ: Thiếu thông tin định danh người dùng.', 401);
    }

    // Chỉ lấy danh tính từ payload của JWT đã được xác thực chữ ký (không tin tưởng uid từ client body/query)
    req.user = {
      uid: Number(decoded.uid),
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Phiên đăng nhập đã hết hạn (Token expired). Vui lòng đăng nhập lại.', 401));
    }
    return next(new AppError('Token không hợp lệ hoặc chữ ký xác thực sai.', 401));
  }
};

