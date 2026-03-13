import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestUser() {
  try {
    // 查找测试用户
    const testUser = await prisma.user.findUnique({
      where: { email: 'testdelete@example.com' },
    });

    if (!testUser) {
      console.log('❌ 测试用户不存在');
      return;
    }

    // 删除测试用户
    await prisma.user.delete({
      where: { id: testUser.id },
    });

    console.log('✅ 测试用户删除成功!');
    console.log('📧 被删除的用户邮箱:', testUser.email);
    console.log('👤 被删除的用户ID:', testUser.id);
  } catch (error) {
    console.error('❌ 删除用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestUser();