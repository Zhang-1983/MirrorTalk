import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';

const router = Router();

// 获取所有模板（包括用户自己的和公开的）
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const templates = await prisma.multiAgentTemplate.findMany({
      where: {
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        topic: template.topic,
        agents: JSON.parse(template.agents),
        isPublic: template.isPublic,
        isOwner: template.userId === userId,
        createdBy: template.user.name,
        createdAt: template.createdAt,
      })),
    });
  })
);

// 获取单个模板详情
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const template = await prisma.multiAgentTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: '模板不存在' },
      });
    }

    res.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        topic: template.topic,
        agents: JSON.parse(template.agents),
        isPublic: template.isPublic,
        isOwner: template.userId === userId,
        createdBy: template.user.name,
        createdAt: template.createdAt,
      },
    });
  })
);

// 创建模板
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().withMessage('模板名称不能为空'),
    body('topic').notEmpty().withMessage('对话主题不能为空'),
    body('agents').isArray({ min: 2 }).withMessage('至少需要两个智能体'),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, description, topic, agents, isPublic } = req.body;
    const userId = req.user!.id;

    const template = await prisma.multiAgentTemplate.create({
      data: {
        name,
        description,
        topic,
        agents: JSON.stringify(agents),
        isPublic: isPublic || false,
        userId,
      },
    });

    res.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        topic: template.topic,
        agents: JSON.parse(template.agents),
        isPublic: template.isPublic,
        createdAt: template.createdAt,
      },
    });
  })
);

// 更新模板
router.put(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, description, topic, agents, isPublic } = req.body;
    const userId = req.user!.id;

    // 检查模板是否存在且属于当前用户
    const existingTemplate = await prisma.multiAgentTemplate.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: '模板不存在或无权限修改' },
      });
    }

    const template = await prisma.multiAgentTemplate.update({
      where: { id },
      data: {
        name: name || existingTemplate.name,
        description: description !== undefined ? description : existingTemplate.description,
        topic: topic || existingTemplate.topic,
        agents: agents ? JSON.stringify(agents) : existingTemplate.agents,
        isPublic: isPublic !== undefined ? isPublic : existingTemplate.isPublic,
      },
    });

    res.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        topic: template.topic,
        agents: JSON.parse(template.agents),
        isPublic: template.isPublic,
        createdAt: template.createdAt,
      },
    });
  })
);

// 删除模板
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // 检查模板是否存在且属于当前用户
    const existingTemplate = await prisma.multiAgentTemplate.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: '模板不存在或无权限删除' },
      });
    }

    await prisma.multiAgentTemplate.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '模板已删除',
    });
  })
);

export { router as multiAgentTemplateRouter };
