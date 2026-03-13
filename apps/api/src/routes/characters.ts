import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { generateCharacter } from '../utils/ai';

const router = Router();

// 生成角色
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROMPT', message: '请提供角色描述' },
      });
    }

    const character = await generateCharacter(prompt);

    res.json({
      success: true,
      data: character,
    });
  })
);

// 保存角色
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { name, position, personality, background, emotionalTriggers, behaviorGuidelines } = req.body;

    if (!name || !position) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: '请填写角色名称和职位' },
      });
    }

    // 创建一个临时场景来存储角色
    const scenario = await prisma.scenario.create({
      data: {
        title: `自定义角色: ${name}`,
        description: `由用户自定义的角色: ${position}`,
        category: 'FEEDBACK',
        difficulty: 'INTERMEDIATE',
        background: JSON.stringify({
          context: background || '这是一个用户自定义的场景',
          employeeProfile: {
            name,
            position,
            tenure: '1年',
            personality: personality?.split(',').map((p: string) => p.trim()) || [],
            strengths: [],
            weaknesses: [],
            background: background || ''
          }
        }),
        aiCharacter: JSON.stringify({
          name,
          personality,
          emotionalTriggers,
          behaviorGuidelines
        }),
        evaluationDimensions: JSON.stringify([
          { name: '同理心', description: '能否理解员工处境，给予适当关怀', weight: 0.25 },
          { name: '表达清晰度', description: '能否清晰表达绩效问题和期望', weight: 0.2 },
          { name: '倾听能力', description: '能否有效倾听员工意见', weight: 0.2 },
          { name: '问题解决', description: '能否帮助员工解决问题', weight: 0.2 },
          { name: '情绪管理', description: '能否营造积极氛围', weight: 0.15 }
        ]),
        estimatedDuration: 10,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        id: scenario.id,
        name: scenario.title,
        position
      },
    });
  })
);

export default router;