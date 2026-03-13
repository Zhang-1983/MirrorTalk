import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';

const router = Router();

// 获取当前用户信息
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        level: true,
        department: true,
        avatarUrl: true,
        dailyLimit: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

// 获取用户训练历史
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [sessions, total] = await Promise.all([
      prisma.dialogueSession.findMany({
        where: { userId: req.user!.id },
        include: {
          scenario: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
            },
          },
          report: {
            select: {
              overallScore: true,
              createdAt: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.dialogueSession.count({
        where: { userId: req.user!.id },
      }),
    ]);

    res.json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          id: session.id,
          scenario: session.scenario,
          status: session.status,
          messageCount: session._count.messages,
          score: session.report?.overallScore,
          createdAt: session.createdAt,
          completedAt: session.report?.createdAt,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  })
);

// 更新用户信息
router.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, department, level, avatarUrl, dailyLimit } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name,
        department,
        level,
        avatarUrl,
        dailyLimit,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        level: true,
        department: true,
        avatarUrl: true,
        dailyLimit: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

// 获取用户功能栏设置 - 必须在 /:id 路由之前定义
router.get(
  '/menu',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const menuItems = await prisma.menuItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { order: 'asc' },
    });

    // 如果没有设置，返回默认菜单
    if (menuItems.length === 0) {
      const defaultMenu = [
        { name: '仪表盘', key: 'dashboard', isVisible: true, order: 0 },
        { name: '剧本训练', key: 'scenarios', isVisible: true, order: 1 },
        { name: '自定义剧本', key: 'custom-scenario', isVisible: true, order: 4 },
        { name: '多智能体对话', key: 'multi-agent', isVisible: true, order: 2 },
        { name: '训练历史', key: 'history', isVisible: true, order: 3 },
      ];

      // 保存默认菜单到数据库
      const createdMenuItems = await Promise.all(
        defaultMenu.map(item => 
          prisma.menuItem.create({
            data: {
              ...item,
              userId: req.user!.id,
            },
          })
        )
      );

      return res.json({
        success: true,
        data: createdMenuItems,
      });
    }

    res.json({
      success: true,
      data: menuItems,
    });
  })
);

// 更新用户功能栏设置 - 必须在 /:id 路由之前定义
router.patch(
  '/menu',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const menuItems = req.body;

    if (!Array.isArray(menuItems)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: '菜单数据格式错误' },
      });
    }

    // 删除旧的菜单设置
    await prisma.menuItem.deleteMany({
      where: { userId: req.user!.id },
    });

    // 创建新的菜单设置
    const createdMenuItems = await Promise.all(
      menuItems.map(item => 
        prisma.menuItem.create({
          data: {
            name: item.name,
            key: item.key,
            isVisible: item.isVisible,
            order: item.order,
            userId: req.user!.id,
          },
        })
      )
    );

    res.json({
      success: true,
      data: createdMenuItems,
    });
  })
);

// 管理员 - 获取所有用户
router.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        level: true,
        department: true,
        avatarUrl: true,
        dailyLimit: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  })
);

// 管理员 - 删除用户
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // 不能删除自己
    if (id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_DELETE_SELF', message: '不能删除自己' },
      });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
      });
    }

    // 删除用户
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: '用户删除成功' },
    });
  })
);

// 管理员 - 更新用户设置
router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { dailyLimit, isActive } = req.body;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
      });
    }

    // 更新用户设置
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        dailyLimit,
        isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        dailyLimit: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  })
);

export { router as userRouter };
