const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // 检查是否已经存在管理员用户
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@mirrortalk.com' }
    });

    if (existingAdmin) {
      console.log('管理员用户已存在:', existingAdmin);
      return;
    }

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@mirrortalk.com',
        password: hashedPassword,
        name: '管理员',
        role: 'ADMIN',
        level: '高级',
        department: '管理部',
        isActive: true,
        dailyLimit: 100,
      }
    });

    console.log('管理员用户创建成功:', admin)

  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();