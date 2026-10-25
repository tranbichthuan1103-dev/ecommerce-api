import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/appError.js';

export const getCurrentUserProfile = async (uid) => {
  const userId = Number(uid);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Định danh người dùng không hợp lệ.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { uid: userId },
    include: {
      role: true,
      membership: true,
    },
  });

  if (!user) {
    throw new AppError('Không tìm thấy tài khoản người dùng.', 404);
  }

  // Trả về thông tin người dùng đã loại bỏ hoàn toàn trường password
  return {
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
  };
};

