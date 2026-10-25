import { getCurrentUserProfile } from './user.service.js';

export const getMe = async (req, res, next) => {
  try {
    // Lấy uid trực tiếp từ req.user đã được middleware JWT xác thực
    const profile = await getCurrentUserProfile(req.user.uid);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

