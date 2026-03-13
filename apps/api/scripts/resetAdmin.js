const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    console.log('重置管理员账号...');
    
    // 删除现有的管理员账号
    await prisma.user.deleteMany({ where: { email: 'admin@example.com' } });
    console.log('已删除现有管理员账号');
    
    // 哈希密码
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建新的管理员账号
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: passwordHash,
        name: '管理员',
        role: 'ADMIN',
        level: 'SENIOR',
        isActive: true
      }
    });
    
    console.log('管理员账号重置成功:');
    console.log(`邮箱: ${adminUser.email}`);
    console.log(`姓名: ${adminUser.name}`);
    console.log(`角色: ${adminUser.role}`);
    console.log(`密码: ${password}`);
    console.log(`密码哈希: ${passwordHash}`);
    
  } catch (error) {
    console.error('重置管理员账号时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
