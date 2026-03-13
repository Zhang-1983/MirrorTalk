import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { generateEvaluationReport as generateAIReport, generateMultiAgentSummary } from '../config/ai';

const router = Router();

// 评估维度定义
const EVALUATION_DIMENSIONS = [
  {
    id: 'empathy',
    name: '同理心',
    description: '能否理解并回应对方的情感需求',
    weight: 0.25,
  },
  {
    id: 'clarity',
    name: '表达清晰度',
    description: '表达是否清晰、有条理',
    weight: 0.20,
  },
  {
    id: 'listening',
    name: '倾听能力',
    description: '是否给予对方充分的表达空间',
    weight: 0.20,
  },
  {
    id: 'problemSolving',
    name: '问题解决',
    description: '能否有效识别和解决问题',
    weight: 0.20,
  },
  {
    id: 'emotionalControl',
    name: '情绪管理',
    description: '在压力下保持冷静和专业',
    weight: 0.15,
  },
];

// 生成评估报告
async function generateEvaluationReport(sessionId: string) {
  const session = await prisma.dialogueSession.findUnique({
    where: { id: sessionId },
    include: {
      scenario: true,
      messages: {
        where: { role: { in: ['USER', 'ASSISTANT'] } },
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const metadata = JSON.parse(session.metadata || '{}');
  const isMultiAgent = metadata.isMultiAgent;

  const messages = session.messages;
  const userMessages = messages.filter(m => m.role === 'USER');
  const aiMessages = messages.filter(m => m.role === 'ASSISTANT');

  // 构建对话历史用于分析
  const dialogueHistory = messages.map(m => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
    metadata: m.metadata ? JSON.parse(m.metadata) : null,
  }));

  // 多智能体对话报告
  if (isMultiAgent) {
    const topic = metadata.topic || '未命名主题';
    const agents = metadata.agents || [];

    // 生成多智能体对话总结
    const multiAgentSummary = await generateMultiAgentSummary(dialogueHistory, topic, agents);

    // 保存报告
    const report = await prisma.evaluationReport.create({
      data: {
        sessionId,
        userId: session.userId,
        scenarioId: session.scenarioId,
        overallScore: 0, // 多智能体对话不需要评分
        dimensionScores: JSON.stringify([]),
        analysis: JSON.stringify({
          type: 'multi-agent',
          summary: multiAgentSummary.summary,
          keyPoints: multiAgentSummary.keyPoints,
          agentPerformances: multiAgentSummary.agentPerformances,
          meetingMinutes: multiAgentSummary.meetingMinutes,
        }),
        wordCloud: JSON.stringify([]),
        suggestions: JSON.stringify([]),
      },
    });

    return report;
  }

  // 单智能体对话报告（原有逻辑）
  // 使用AI进行深度分析
  const evaluationDimensions = [
    '同理心',
    '表达清晰度',
    '倾听能力',
    '问题解决',
    '情绪管理'
  ];

  const analysisResult = await generateAIReport(dialogueHistory, evaluationDimensions);

  // 计算词云
  const wordCloud = generateWordCloud(userMessages.map(m => m.content));

  // 计算综合得分
  const overallScore = Math.round(
    Object.values(analysisResult.scores).reduce((sum, score) => sum + score, 0) / 
    Object.values(analysisResult.scores).length
  );

  // 保存报告
  const report = await prisma.evaluationReport.create({
    data: {
      sessionId,
      userId: session.userId,
      scenarioId: session.scenarioId,
      overallScore,
      dimensionScores: JSON.stringify(Object.entries(analysisResult.scores).map(([name, score]) => ({
        dimensionId: name.toLowerCase(),
        score,
        feedback: '',
        evidence: []
      }))),
      analysis: JSON.stringify({
        type: 'single-agent',
        strengths: analysisResult.strengths,
        weaknesses: [],
        criticalMoments: [],
        summary: analysisResult.analysis
      }),
      wordCloud: JSON.stringify(wordCloud),
      suggestions: JSON.stringify(analysisResult.suggestions.map((s: any) => ({
        category: '改进建议',
        title: s,
        description: s,
        example: {
          before: '',
          after: ''
        },
        priority: 'medium'
      }))),
    },
  });

  return report;
}

// 生成词云
function generateWordCloud(texts: string[]) {
  const wordCounts: Record<string, { count: number; sentiment: string; category: string }> = {};
  
  const empathyWords = ['理解', '感受', '知道', '明白', '体谅', '关心', '支持'];
  const blameWords = ['但是', '然而', '可是', '为什么', '怎么', '应该', '必须'];
  const questionWords = ['什么', '怎么', '为什么', '如何', '能否', '可以吗'];
  
  texts.forEach(text => {
    const words = text.split(/[\s,，.。!！?？;；]+/);
    words.forEach(word => {
      if (word.length >= 2) {
        if (!wordCounts[word]) {
          wordCounts[word] = { count: 0, sentiment: 'neutral', category: 'other' };
        }
        wordCounts[word].count++;
        
        if (empathyWords.includes(word)) {
          wordCounts[word].sentiment = 'positive';
          wordCounts[word].category = 'empathy';
        } else if (blameWords.includes(word)) {
          wordCounts[word].sentiment = 'negative';
          wordCounts[word].category = 'blame';
        } else if (questionWords.includes(word)) {
          wordCounts[word].category = 'question';
        }
      }
    });
  });

  return Object.entries(wordCounts)
    .filter(([_, data]) => data.count > 1)
    .map(([word, data]) => ({
      word,
      count: data.count,
      sentiment: data.sentiment,
      category: data.category,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// 获取用户统计摘要 - 这个路由必须放在 /:sessionId 之前，否则会被 /:sessionId 匹配
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    // 获取所有会话
    const allSessions = await prisma.dialogueSession.findMany({
      where: { userId },
    });

    // 区分多智能体对话和剧本训练
    const multiAgentSessions = allSessions.filter(session => {
      try {
        const metadata = JSON.parse(session.metadata || '{}');
        return metadata.isMultiAgent === true;
      } catch {
        return false;
      }
    });

    const scenarioSessions = allSessions.filter(session => {
      try {
        const metadata = JSON.parse(session.metadata || '{}');
        return metadata.isMultiAgent !== true;
      } catch {
        return true;
      }
    });

    // 统计多智能体对话
    const totalMultiAgentSessions = multiAgentSessions.length;
    const completedMultiAgentSessions = multiAgentSessions.filter(session => session.status === 'COMPLETED').length;

    // 统计剧本训练
    const totalScenarioSessions = scenarioSessions.length;
    const completedScenarioSessions = scenarioSessions.filter(session => session.status === 'COMPLETED').length;

    // 获取报告
    const reports = await prisma.evaluationReport.findMany({
      where: { userId },
      select: { overallScore: true, scenario: { select: { category: true } }, session: { select: { metadata: true } } },
    });

    // 区分多智能体报告和剧本训练报告
    const scenarioReports = reports.filter(report => {
      try {
        const metadata = JSON.parse(report.session.metadata || '{}');
        return metadata.isMultiAgent !== true;
      } catch {
        return true;
      }
    });

    // 计算剧本训练的平均分
    const avgScenarioScore = scenarioReports.length > 0
      ? Math.round(scenarioReports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / scenarioReports.length)
      : 0;

    // 按类别统计
    const categoryScores: Record<string, { count: number; avgScore: number }> = {};
    scenarioReports.forEach(report => {
      if (report.scenario) {
        const category = report.scenario.category;
        if (!categoryScores[category]) {
          categoryScores[category] = { count: 0, avgScore: 0 };
        }
        categoryScores[category].count++;
        categoryScores[category].avgScore += report.overallScore || 0;
      }
    });

    Object.keys(categoryScores).forEach(key => {
      categoryScores[key].avgScore = Math.round(
        categoryScores[key].avgScore / categoryScores[key].count
      );
    });

    res.json({
      success: true,
      data: {
        // 总体统计
        totalSessions: allSessions.length,
        completedSessions: allSessions.filter(session => session.status === 'COMPLETED').length,
        completionRate: allSessions.length > 0 ? Math.round((allSessions.filter(session => session.status === 'COMPLETED').length / allSessions.length) * 100) : 0,
        averageScore: avgScenarioScore, // 只计算剧本训练的平均分
        totalReports: reports.length,
        categoryPerformance: categoryScores,
        
        // 多智能体对话统计
        multiAgent: {
          totalSessions: totalMultiAgentSessions,
          completedSessions: completedMultiAgentSessions,
          completionRate: totalMultiAgentSessions > 0 ? Math.round((completedMultiAgentSessions / totalMultiAgentSessions) * 100) : 0,
        },
        
        // 剧本训练统计
        scenario: {
          totalSessions: totalScenarioSessions,
          completedSessions: completedScenarioSessions,
          completionRate: totalScenarioSessions > 0 ? Math.round((completedScenarioSessions / totalScenarioSessions) * 100) : 0,
          averageScore: avgScenarioScore,
        },
      },
    });
  })
);

// 获取评估报告 - 这个路由必须放在 /summary 之后，否则会被 /:sessionId 匹配
router.get(
  '/:sessionId',
  authenticate,
  [param('sessionId').isUUID()],
  asyncHandler(async (req: AuthRequest, res) => {
    const { sessionId } = req.params;

    // 检查会话是否属于当前用户
    const session = await prisma.dialogueSession.findFirst({
      where: {
        id: sessionId,
        userId: req.user!.id,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: '会话不存在' },
      });
    }

    // 检查是否已有报告
    let report = await prisma.evaluationReport.findUnique({
      where: { sessionId },
    });

    // 如果会话已完成但没有报告，生成报告
    if (session.status === 'COMPLETED' && !report) {
      report = await generateEvaluationReport(sessionId);
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'REPORT_NOT_FOUND', message: '报告尚未生成，请先完成对话' },
      });
    }

    // 解析 JSON 字段
    const parsedReport = {
      ...report,
      dimensionScores: JSON.parse(report.dimensionScores),
      analysis: JSON.parse(report.analysis),
      wordCloud: JSON.parse(report.wordCloud),
      suggestions: JSON.parse(report.suggestions),
    };

    // 获取用户历史平均分用于对比
    const userReports = await prisma.evaluationReport.findMany({
      where: { userId: req.user!.id },
      select: { overallScore: true },
    });

    const avgScore = userReports.length > 0
      ? Math.round(userReports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / userReports.length)
      : parsedReport.overallScore;

    res.json({
      success: true,
      data: {
        sessionId: parsedReport.sessionId,
        overallScore: parsedReport.overallScore,
        dimensionScores: parsedReport.dimensionScores,
        analysis: parsedReport.analysis,
        wordCloud: parsedReport.wordCloud,
        suggestions: parsedReport.suggestions,
        comparison: {
          vsSelfAverage: (parsedReport.overallScore || 0) - avgScore,
          totalSessions: userReports.length,
        },
        createdAt: parsedReport.createdAt,
      },
    });
  })
);

export { router as reportRouter };
