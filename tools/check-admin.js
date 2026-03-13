const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('检查管理员账号...');
    
    // 查找管理员账号
    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    
    if (admin) {
      console.log('管理员账号存在:');
      console.log(`ID: ${admin.id}`);
      console.log(`邮箱: ${admin.email}`);
      console.log(`姓名: ${admin.name}`);
      console.log(`角色: ${admin.role}`);
      console.log(`密码哈希: ${admin.passwordHash}`);
    } else {
      console.log('管理员账号不存在');
    }
    
    // 查找所有用户
    const users = await prisma.user.findMany();
    console.log('\n所有用户:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 邮箱: ${user.email}, 姓名: ${user.name}, 角色: ${user.role}`);
    });
    
  } catch (error) {
    console.error('检查管理员账号时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
