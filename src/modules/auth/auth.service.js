import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';

const SALT_ROUNDS = 10;

// Hàm định dạng dữ liệu User trả về (loại bỏ hoàn toàn trường password)
const sanitizeUser = (user) => ({
  uid: user.uid,
  username: user.username,
  fullname: user.fullname,
  roleid: user.roleid,
  mid: user.mid,
  role: user.role
    ? {
        roleid: user.role.roleid,
        rolename: user.role.rolename,
      }
    : null,
  membership: user.membership
    ? {
        mid: user.membership.mid,
        mname: user.membership.mname,
        score: user.membership.score,
      }
    : null,
});

export const registerUser = async (payload) => {
  // 1. Chỉ trích xuất các trường cho phép (ngăn người dùng tự truyền roleid hoặc mid để nâng quyền/điểm)
  const rawUsername = typeof payload?.username === 'string' ? payload.username.trim() : '';
  const rawFullname = typeof payload?.fullname === 'string' ? payload.fullname.trim() : '';
  const rawPassword = typeof payload?.password === 'string' ? payload.password : '';

  // 2. Validate dữ liệu đầu vào
  if (!rawUsername || !rawFullname || !rawPassword) {
    throw new AppError(
      'Vui lòng cung cấp đầy đủ thông tin bắt buộc: username, fullname và password.',
      400
    );
  }

  if (rawUsername.length < 3 || rawUsername.length > 50) {
    throw new AppError('Tên đăng nhập (username) phải có độ dài từ 3 đến 50 ký tự.', 400);
  }

  if (rawFullname.length > 100) {
    throw new AppError('Họ và tên (fullname) không được vượt quá 100 ký tự.', 400);
  }

  if (rawPassword.length < 6) {
    throw new AppError('Mật khẩu (password) phải có độ dài tối thiểu 6 ký tự.', 400);
  }

  // 3. Kiểm tra trùng username
  const existingUser = await prisma.user.findUnique({
    where: { username: rawUsername },
  });

  if (existingUser) {
    throw new AppError(`Tên đăng nhập "${rawUsername}" đã tồn tại.`, 409);
  }

  // 4. Băm mật khẩu bằng bcryptjs (tuyệt đối không lưu văn bản thuần)
  const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);

  // 5. Lấy Role có rolename = 'normal' (hoặc khởi tạo nếu DB chưa có bản ghi nền)
  let normalRole = await prisma.role.findFirst({
    where: { rolename: 'normal' },
  });

  if (!normalRole) {
    normalRole = await prisma.role.create({
      data: { rolename: 'normal' },
    });
  }

  // 6. Lấy bản ghi MemberShip chuẩn có score = 10 (dùng chung theo đúng quan hệ 1 MemberShip - N User)
  let defaultMembership = await prisma.memberShip.findFirst({
    where: { score: 10 },
  });

  if (!defaultMembership) {
    defaultMembership = await prisma.memberShip.create({
      data: {
        mname: 'normal',
        score: 10,
      },
    });
  }

  // 7. Tạo tài khoản mới liên kết tới Role 'normal' và MemberShip score = 10
  try {
    const newUser = await prisma.user.create({
      data: {
        username: rawUsername,
        fullname: rawFullname,
        password: hashedPassword,
        roleid: normalRole.roleid,
        mid: defaultMembership.mid,
      },
      include: {
        role: true,
        membership: true,
      },
    });

    return sanitizeUser(newUser);
  } catch (error) {
    // Bắt lỗi Unique Constraint ở tầng PostgreSQL (P2002) trong trường hợp gửi 2 request đồng thời
    if (error.code === 'P2002') {
      throw new AppError(`Tên đăng nhập "${rawUsername}" đã tồn tại.`, 409);
    }
    throw error;
  }
};

export const loginUser = async (payload) => {
  const rawUsername = typeof payload?.username === 'string' ? payload.username.trim() : '';
  const rawPassword = typeof payload?.password === 'string' ? payload.password : '';

  if (!rawUsername || !rawPassword) {
    throw new AppError('Vui lòng nhập đầy đủ username và password.', 400);
  }

  // 1. Tìm tài khoản theo username kèm Role và MemberShip
  const user = await prisma.user.findUnique({
    where: { username: rawUsername },
    include: {
      role: true,
      membership: true,
    },
  });

  if (!user) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không chính xác.', 401);
  }

  // 2. So sánh mật khẩu nhập vào với chuỗi băm trong DB
  const isPasswordMatch = await bcrypt.compare(rawPassword, user.password);
  if (!isPasswordMatch) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không chính xác.', 401);
  }

  // 3. Tạo JWT (Payload chỉ chứa thông tin định danh cần thiết, không chứa password/hash)
  const tokenPayload = {
    uid: user.uid,
    username: user.username,
    role: user.role?.rolename || 'normal',
  };

  const token = jwt.sign(tokenPayload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    expiresIn: env.jwtExpiresIn,
    user: sanitizeUser(user),
  };
};

