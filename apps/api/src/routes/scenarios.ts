import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { generateScenario } from '../utils/scenarioGenerator';

const router = Router();

// 获取剧本列表
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { category, difficulty, search } = req.query;

    // 管理员可以看到所有剧本，普通用户只能看到启用的剧本
    const where: any = req.user!.role === 'ADMIN' ? {} : { isActive: true };

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const scenarios = await prisma.scenario.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedDuration: true,
        background: true,
        evaluationDimensions: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: scenarios,
    });
  })
);

// 获取剧本详情
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!scenario || !scenario.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENARIO_NOT_FOUND', message: '剧本不存在' },
      });
    }

    res.json({
      success: true,
      data: {
        ...scenario,
        sessionCount: scenario._count.sessions,
      },
    });
  })
);

// 获取剧本分类和统计
router.get(
  '/stats/categories',
  authenticate,
  asyncHandler(async (req, res) => {
    const categories = await prisma.scenario.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true },
    });

    const difficulties = await prisma.scenario.groupBy({
      by: ['difficulty'],
      where: { isActive: true },
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        categories: categories.map(c => ({
          name: c.category,
          count: c._count.id,
        })),
        difficulties: difficulties.map(d => ({
          name: d.difficulty,
          count: d._count.id,
        })),
      },
    });
  })
);

// 生成剧本
router.post(
  '/generate',
  // 暂时移除认证要求，以便测试AI生成功能
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PROMPT', message: '请输入剧本描述' },
      });
    }

    try {
      const generatedScenario = await generateScenario(prompt);

      // 确保返回的数据格式与前端期望的一致
      const formattedScenario = {
        title: generatedScenario.title || '',
        category: generatedScenario.category || 'PERFORMANCE',
        difficulty: generatedScenario.difficulty || 'BEGINNER',
        description: generatedScenario.description || '',
        objective: generatedScenario.objective || '',
        estimatedDuration: generatedScenario.estimatedDuration || 15,
        character: {
          name: generatedScenario.character?.name || '',
          position: generatedScenario.character?.position || '',
          personality: generatedScenario.character?.personality || '',
          background: generatedScenario.character?.background || '',
          emotionalTriggers: generatedScenario.character?.emotionalTriggers || [],
          behaviorGuidelines: generatedScenario.character?.behaviorGuidelines || []
        },
        background: generatedScenario.background || '',
        initialMessage: generatedScenario.initialMessage || '',
        evaluationCriteria: generatedScenario.evaluationCriteria || ''
      };

      res.json({
        success: true,
        data: formattedScenario,
      });
    } catch (error) {
      console.error('Error generating scenario:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '生成剧本失败，请重试' },
      });
    }
  })
);

// 创建剧本
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { title, category, difficulty, description, estimatedDuration, character, background, initialMessage, evaluationDimensions } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: '请填写剧本标题和描述' },
      });
    }

    const scenario = await prisma.scenario.create({
      data: {
        title,
        category,
        difficulty,
        description,
        estimatedDuration,
        aiCharacter: JSON.stringify(character),
        background,
        evaluationDimensions: typeof evaluationDimensions === 'string' ? JSON.stringify(evaluationDimensions.split('\n').filter(Boolean)) : JSON.stringify(evaluationDimensions),
        isActive: true,
      },
    });

    res.json({
      success: true,
      data: scenario,
    });
  })
);

// 管理员 - 删除剧本（支持软删除和硬删除）
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { mode = 'soft' } = req.query; // mode: 'soft' | 'hard'

    // 检查剧本是否存在
    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENARIO_NOT_FOUND', message: '剧本不存在' },
      });
    }

    if (mode === 'hard') {
      // 硬删除：先删除关联的对话会话和评估报告
      // 1. 删除该剧本相关的所有评估报告
      await prisma.evaluationReport.deleteMany({
        where: { scenarioId: id },
      });

      // 2. 删除该剧本相关的所有对话会话（关联的消息会自动级联删除）
      await prisma.dialogueSession.deleteMany({
        where: { scenarioId: id },
      });

      // 3. 删除剧本
      await prisma.scenario.delete({
        where: { id },
      });

      res.json({
        success: true,
        data: { message: '剧本已永久删除' },
      });
    } else {
      // 软删除：将isActive设置为false
      await prisma.scenario.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        data: { message: '剧本已禁用（软删除）' },
      });
    }
  })
);

// 管理员 - 更新剧本状态
router.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    // 检查剧本是否存在
    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENARIO_NOT_FOUND', message: '剧本不存在' },
      });
    }

    // 更新剧本状态
    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      data: updatedScenario,
    });
  })
);

export { router as scenarioRouter };
