import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // 检查是否已经存在管理员用户
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('管理员用户已存在:', existingAdmin);
      return;
    }

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        name: '管理员',
        role: 'ADMIN',
        level: '高级',
        department: '管理部',
        isActive: true,
        dailyLimit: 100,
      }
    });

    console.log('管理员用户创建成功:', admin);

    // 创建一些测试用户
    const testUsers = [
      {
        email: 'manager1@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: '张经理',
        role: 'MANAGER',
        level: '中级',
        department: '销售部',
        isActive: true,
        dailyLimit: 10,
      },
      {
        email: 'hr1@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: '李HR',
        role: 'HR',
        level: '初级',
        department: '人力资源部',
        isActive: true,
        dailyLimit: 10,
      },
      {
        email: 'manager2@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: '王经理',
        role: 'MANAGER',
        level: '高级',
        department: '技术部',
        isActive: true,
        dailyLimit: 15,
      },
    ];

    for (const userData of testUsers) {
      await prisma.user.create({ data: userData });
      console.log('测试用户创建成功:', userData.name);
    }

  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();