const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manageUsers() {
  try {
    // 获取所有用户
    const users = await prisma.user.findMany();
    console.log('当前用户列表:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 邮箱: ${user.email}, 姓名: ${user.name}, 角色: ${user.role}`);
    });

    // 定义要保留的用户
    const keepUsers = [];

    // 删除不需要的用户
    for (const user of users) {
      if (!keepUsers.includes(user.email)) {
        console.log(`删除用户: ${user.name} (${user.email})`);
        
        // 先获取用户的对话会话
        const sessions = await prisma.dialogueSession.findMany({ where: { userId: user.id } });
        const sessionIds = sessions.map(session => session.id);
        
        // 先删除关联的评估报告
        await prisma.evaluationReport.deleteMany({ where: { userId: user.id } });
        
        // 先删除关联的消息（通过级联删除或直接删除）
        if (sessionIds.length > 0) {
          await prisma.message.deleteMany({ where: { sessionId: { in: sessionIds } } });
        }
        
        // 先删除关联的对话会话
        await prisma.dialogueSession.deleteMany({ where: { userId: user.id } });
        
        // 先删除关联的多智能体模板
        await prisma.multiAgentTemplate.deleteMany({ where: { userId: user.id } });
        
        // 先删除关联的菜单项
        await prisma.menuItem.deleteMany({ where: { userId: user.id } });
        
        // 再删除用户
        await prisma.user.delete({ where: { id: user.id } });
      }
    }

    // 再次获取用户列表，确认结果
    const finalUsers = await prisma.user.findMany();
    console.log('\n处理后的用户列表:');
    finalUsers.forEach(user => {
      console.log(`ID: ${user.id}, 邮箱: ${user.email}, 姓名: ${user.name}, 角色: ${user.role}`);
    });

  } catch (error) {
    console.error('处理用户数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manageUsers();
