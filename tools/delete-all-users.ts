import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    // 首先获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log(`当前共有 ${users.length} 个用户`);

    // 过滤出非管理员用户
    const nonAdminUsers = users.filter(user => user.role !== 'ADMIN');
    console.log(`其中非管理员用户 ${nonAdminUsers.length} 个`);

    // 逐一删除非管理员用户及其相关数据
    let deletedCount = 0;
    for (const user of nonAdminUsers) {
      try {
        console.log(`\n处理用户: ${user.email}`);

        // 1. 删除用户的评估报告
        const reports = await prisma.evaluationReport.findMany({
          where: { userId: user.id },
        });
        if (reports.length > 0) {
          await prisma.evaluationReport.deleteMany({
            where: { userId: user.id },
          });
          console.log(`  ✅ 删除了 ${reports.length} 个评估报告`);
        }

        // 2. 获取用户的对话会话
        const sessions = await prisma.dialogueSession.findMany({
          where: { userId: user.id },
          select: { id: true },
        });

        if (sessions.length > 0) {
          // 3. 删除会话的消息
          for (const session of sessions) {
            await prisma.message.deleteMany({
              where: { sessionId: session.id },
            });
          }
          console.log(`  ✅ 删除了 ${sessions.length} 个会话的消息`);

          // 4. 删除会话本身
          await prisma.dialogueSession.deleteMany({
            where: { userId: user.id },
          });
          console.log(`  ✅ 删除了 ${sessions.length} 个对话会话`);
        }

        // 5. 删除用户
        await prisma.user.delete({
          where: { id: user.id },
        });
        console.log(`  ✅ 删除用户成功`);
        deletedCount++;

      } catch (error) {
        console.error(`  ❌ 处理用户 ${user.email} 失败:`, error);
      }
    }

    console.log(`\n✅ 任务完成!`);
    console.log(`共删除了 ${deletedCount} 个用户`);
    console.log(`剩余 ${users.length - deletedCount} 个用户（管理员账号）`);

  } catch (error) {
    console.error('❌ 操作过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();