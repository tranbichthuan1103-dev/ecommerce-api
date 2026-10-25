import { loginUser, registerUser } from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

