import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Bắt đầu khởi tạo dữ liệu nền (Role & MemberShip)...');

  // 1. Đảm bảo tồn tại Role 'normal' (và 'admin')
  let normalRole = await prisma.role.findFirst({
    where: { rolename: 'normal' },
  });

  if (!normalRole) {
    normalRole = await prisma.role.create({
      data: { rolename: 'normal' },
    });
    console.log('[Seed] Đã tạo Role:', normalRole);
  } else {
    console.log('[Seed] Role "normal" đã tồn tại:', normalRole);
  }

  let adminRole = await prisma.role.findFirst({
    where: { rolename: 'admin' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { rolename: 'admin' },
    });
    console.log('[Seed] Đã tạo Role:', adminRole);
  }

  // 2. Đảm bảo tồn tại hạng MemberShip mặc định với score = 10
  // Các User mới đăng ký sẽ cùng tham chiếu (FK mid) tới bản ghi này (Quan hệ 1 MemberShip - N User)
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
    console.log('[Seed] Đã tạo MemberShip mặc định (score=10):', defaultMembership);
  } else {
    console.log('[Seed] MemberShip mặc định (score=10) đã tồn tại:', defaultMembership);
  }

  console.log('[Seed] Hoàn tất khởi tạo dữ liệu nền.');
}

main()
  .catch((error) => {
    console.error('[Seed Error] Lỗi khi khởi tạo dữ liệu:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

