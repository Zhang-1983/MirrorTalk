import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCustomScenarios() {
  try {
    // 查找所有自定义剧本（标题包含"自定义"字样）
    const customScenarios = await prisma.scenario.findMany({
      where: {
        title: {
          contains: '自定义'
        }
      }
    });

    console.log(`找到 ${customScenarios.length} 个自定义剧本`);

    if (customScenarios.length === 0) {
      console.log('没有自定义剧本需要清空');
      return;
    }

    // 显示要删除的剧本
    console.log('\n要清空的自定义剧本列表：');
    customScenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.title} (ID: ${scenario.id})`);
    });

    // 使用软删除方式清空自定义剧本
    let deletedCount = 0;
    for (const scenario of customScenarios) {
      try {
        await prisma.scenario.update({
          where: { id: scenario.id },
          data: { isActive: false }
        });
        console.log(`✅ 已删除: ${scenario.title}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ 删除失败: ${scenario.title}`, error);
      }
    }

    console.log(`\n✅ 成功清空 ${deletedCount} 个自定义剧本`);

  } catch (error) {
    console.error('清空自定义剧本失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCustomScenarios();