import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { generateSystemPrompt, generateMultiAgentSystemPrompt, generateAIResponse, analyzeEmotion } from '../config/ai';
import { initializeState, analyzeUserBehavior, updateState, generateDynamicPrompt, getTemperature, EmotionalState } from '../utils/dynamicDifficulty';

const router = Router();

// 创建对话会话
router.post(
  '/',
  authenticate,
  [body('scenarioId').isString()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { scenarioId, topic, agents } = req.body;

    // 检查是否为多智能体对话
    if (scenarioId === 'multi-agent') {
      if (!topic || !agents || agents.length < 2) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: '多智能体对话需要主题和至少两个智能体' },
        });
      }

      // 创建多智能体对话会话
      const session = await prisma.dialogueSession.create({
        data: {
          userId: req.user!.id,
          // 多智能体对话不需要 scenarioId
          status: 'ACTIVE',
          metadata: JSON.stringify({
            startTime: new Date().toISOString(),
            messageCount: 0,
            userMessageCount: 0,
            aiMessageCount: 0,
            isMultiAgent: true,
            topic,
            agents,
            currentAgentIndex: 0,
          }),
        },
      });

      // 生成系统提示
      const systemPrompt = generateMultiAgentSystemPrompt(topic, agents);
      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'SYSTEM',
          content: systemPrompt,
          type: 'TEXT',
        },
      });

      // 生成AI开场白（随机选择一个智能体）
      const randomAgentIndex = Math.floor(Math.random() * agents.length);
      const openingAgent = agents[randomAgentIndex];
      const openingMessages = [
        { role: 'system' as const, content: systemPrompt },
        { 
          role: 'user' as const, 
          content: `请以${openingAgent.name}（${openingAgent.position}）的身份，围绕"${topic}"主题开始对话。` 
        },
      ];

      const aiOpening = await generateAIResponse(openingMessages, 0.8);

      // 保存AI开场白
      const emotionAnalysis = await analyzeEmotion(aiOpening);
      const aiMessage = await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'ASSISTANT',
          content: aiOpening,
          type: 'TEXT',
          emotionAnalysis: JSON.stringify(emotionAnalysis),
          metadata: JSON.stringify({
            agentId: openingAgent.id,
            agentName: openingAgent.name,
            agentPosition: openingAgent.position,
          }),
        },
      });

      // 更新会话元数据
      await prisma.dialogueSession.update({
        where: { id: session.id },
        data: {
          metadata: JSON.stringify({
            startTime: new Date().toISOString(),
            messageCount: 2,
            userMessageCount: 0,
            aiMessageCount: 1,
            isMultiAgent: true,
            topic,
            agents,
            currentAgentIndex: (randomAgentIndex + 1) % agents.length,
          }),
        },
      });

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.id,
          scenario: {
            id: 'multi-agent',
            title: `多智能体对话: ${topic}`,
            background: JSON.stringify({ topic, agents }),
            aiCharacter: JSON.stringify({ name: '多智能体', position: '对话参与者' }),
          },
          aiMessage: {
            id: aiMessage.id,
            role: 'assistant',
            content: aiOpening,
            emotionAnalysis,
            timestamp: aiMessage.timestamp,
            metadata: {
              agentId: openingAgent.id,
              agentName: openingAgent.name,
              agentPosition: openingAgent.position,
            },
          },
          status: session.status,
          createdAt: session.createdAt,
        },
      });
      return;
    }

    // 检查剧本是否存在
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId, isActive: true },
    });

    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENARIO_NOT_FOUND', message: '剧本不存在' },
      });
    }

    // 初始化动态难度适配状态
    const initialState = initializeState();
    
    // 创建会话
    const session = await prisma.dialogueSession.create({
      data: {
        userId: req.user!.id,
        scenarioId,
        status: 'ACTIVE',
        metadata: JSON.stringify({
          startTime: new Date().toISOString(),
          messageCount: 0,
          userMessageCount: 0,
          aiMessageCount: 0,
          emotionalState: initialState,
        }),
      },
    });

    // 添加系统消息
    const aiCharacter = JSON.parse(scenario.aiCharacter);
    const systemPrompt = generateSystemPrompt(aiCharacter);
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'SYSTEM',
        content: systemPrompt,
        type: 'TEXT',
      },
    });

    // 生成AI开场白
    const openingMessages = [
      { role: 'system' as const, content: systemPrompt },
      { 
        role: 'user' as const, 
        content: `请根据角色设定，以${aiCharacter.name}的身份，用自然的口语化方式开场。` 
      },
    ];

    const aiOpening = await generateAIResponse(openingMessages, 0.8);

    // 保存AI开场白
    const emotionAnalysis = await analyzeEmotion(aiOpening);
    const aiMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'ASSISTANT',
        content: aiOpening,
        type: 'TEXT',
        emotionAnalysis: JSON.stringify(emotionAnalysis),
      },
    });

    // 更新会话元数据
    await prisma.dialogueSession.update({
      where: { id: session.id },
      data: {
        metadata: JSON.stringify({
          startTime: new Date().toISOString(),
          messageCount: 2,
          userMessageCount: 0,
          aiMessageCount: 1,
        }),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        scenario: {
          id: scenario.id,
          title: scenario.title,
          background: scenario.background,
          aiCharacter: scenario.aiCharacter,
        },
        aiMessage: {
          id: aiMessage.id,
          role: 'assistant',
          content: aiOpening,
          emotionAnalysis,
          timestamp: aiMessage.timestamp,
        },
        status: session.status,
        createdAt: session.createdAt,
      },
    });
  })
);

// 获取会话详情
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const session = await prisma.dialogueSession.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        scenario: true,
        messages: {
          where: {
            role: { in: ['USER', 'ASSISTANT'] },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: '会话不存在' },
      });
    }

    // 检查是否为多智能体对话
    const metadata = JSON.parse(session.metadata || '{}');
    const isMultiAgent = metadata.isMultiAgent;

    res.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        scenario: isMultiAgent ? {
          id: 'multi-agent',
          title: `多智能体对话: ${metadata.topic}`,
          background: JSON.stringify({ topic: metadata.topic, agents: metadata.agents }),
        } : {
          id: session.scenario!.id,
          title: session.scenario!.title,
          background: session.scenario!.background,
        },
        messages: session.messages.map(m => ({
          id: m.id,
          role: m.role.toLowerCase(),
          content: m.content,
          type: m.type,
          emotionAnalysis: m.emotionAnalysis ? JSON.parse(m.emotionAnalysis) : null,
          metadata: m.metadata ? JSON.parse(m.metadata) : null,
          timestamp: m.timestamp,
        })),
        metadata: JSON.parse(session.metadata || '{}'),
        realtimeMetrics: JSON.parse(session.realtimeMetrics || '{}'),
      },
    });
  })
);

// 发送消息
router.post(
  '/:id/messages',
  authenticate,
  [
    param('id').isUUID(),
    body('content').trim().notEmpty(),
    body('type').optional().isIn(['text', 'voice']),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { content, type = 'text', isDynamicMode = true } = req.body;

    // 获取会话
    const session = await prisma.dialogueSession.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'ACTIVE',
      },
      include: {
        scenario: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: '会话不存在或已结束' },
      });
    }

    // 保存用户消息
    const userMessage = await prisma.message.create({
      data: {
        sessionId: id,
        role: 'USER',
        content,
        type: type.toUpperCase(),
      },
    });

    // 构建对话历史
    const systemMessage = session.messages.find(m => m.role === 'SYSTEM');
    const chatHistory = session.messages
      .filter(m => m.role !== 'SYSTEM')
      .map(m => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      }));

    // 检查是否为多智能体对话
    const metadata = JSON.parse(session.metadata || '{}');
    if (metadata.isMultiAgent) {
      // 检查是否为自动对话继续请求
      const isAutoContinue = content === '[继续对话]';
      
      // 随机选择一个智能体（可以根据需要调整选择策略）
      const randomAgentIndex = Math.floor(Math.random() * metadata.agents.length);
      const selectedAgent = metadata.agents[randomAgentIndex];

      // 构建 AI 提示
      let aiPrompt;
      if (isAutoContinue) {
        // 自动对话模式：让 AI 根据上下文继续对话
        aiPrompt = [
          { role: 'system' as const, content: systemMessage?.content || '' },
          ...chatHistory,
          { 
            role: 'user' as const, 
            content: `请以${selectedAgent.name}（${selectedAgent.position}）的身份，根据对话上下文继续发言。可以回应其他人的观点，提出新的想法，或者提出问题推动讨论。` 
          },
        ];
      } else {
        // 用户干预模式：回应用户的输入
        aiPrompt = [
          { role: 'system' as const, content: systemMessage?.content || '' },
          ...chatHistory,
          { role: 'user' as const, content },
          { 
            role: 'user' as const, 
            content: `请以${selectedAgent.name}（${selectedAgent.position}）的身份，针对上述对话内容进行回复。` 
          },
        ];
      }

      // 生成AI回复
      const aiContent = await generateAIResponse(aiPrompt, 0.8);

      // 分析情感
      const emotionAnalysis = await analyzeEmotion(aiContent);

      // 保存AI消息
      const aiMessage = await prisma.message.create({
        data: {
          sessionId: id,
          role: 'ASSISTANT',
          content: aiContent,
          type: 'TEXT',
          emotionAnalysis: JSON.stringify(emotionAnalysis),
          metadata: JSON.stringify({
            agentId: selectedAgent.id,
            agentName: selectedAgent.name,
            agentPosition: selectedAgent.position,
          }),
        },
      });

      // 更新会话元数据
      const userMessageCount = (metadata.userMessageCount || 0) + 1;
      const aiMessageCount = (metadata.aiMessageCount || 0) + 1;
      const totalMessageCount = userMessageCount + aiMessageCount;

      // 计算实时指标
      const userTalkRatio = userMessageCount / totalMessageCount;
      const questionCount = (content.match(/[?？]/g) || []).length + 
        (metadata.questionCount || 0);

      await prisma.dialogueSession.update({
        where: { id },
        data: {
          metadata: JSON.stringify({
            ...metadata,
            messageCount: totalMessageCount,
            userMessageCount,
            aiMessageCount,
            questionCount,
          }),
          realtimeMetrics: JSON.stringify({
            userTalkRatio: Math.round(userTalkRatio * 100) / 100,
            questionCount,
            lastMessageAt: new Date().toISOString(),
          }),
        },
      });

      res.json({
        success: true,
        data: {
          userMessage: {
            id: userMessage.id,
            role: 'user',
            content: userMessage.content,
            timestamp: userMessage.timestamp,
          },
          aiMessage: {
            id: aiMessage.id,
            role: 'assistant',
            content: aiContent,
            emotionAnalysis,
            timestamp: aiMessage.timestamp,
            metadata: {
              agentId: selectedAgent.id,
              agentName: selectedAgent.name,
              agentPosition: selectedAgent.position,
            },
          },
          realtimeMetrics: {
            userTalkRatio: Math.round(userTalkRatio * 100) / 100,
            questionCount,
          },
        },
      });
      return;
    }

    // 构建消息数组
    let messages;
    let temperature = 0.8;
    let newState = metadata.emotionalState || initializeState();
    let behaviorAnalysis = { isPositive: true, changes: { trustChange: 0, emotionChange: 0, cooperationChange: 0 }, keywords: [] };
    
    if (isDynamicMode) {
      // 分析用户行为
      behaviorAnalysis = await analyzeUserBehavior(content);
      
      // 获取当前情绪状态
      const currentState = metadata.emotionalState || initializeState();
      
      // 更新情绪状态
      newState = updateState(currentState, behaviorAnalysis.changes);
      
      // 生成动态系统提示词
      const dynamicSystemPrompt = generateDynamicPrompt(newState, systemMessage?.content || '');
      
      // 构建消息数组
      messages = [
        { role: 'system' as const, content: dynamicSystemPrompt },
        ...chatHistory,
        { role: 'user' as const, content },
      ];

      // 获取温度参数
      temperature = getTemperature(newState);
    } else {
      // 不使用动态难度适配
      messages = [
        { role: 'system' as const, content: systemMessage?.content || '' },
        ...chatHistory,
        { role: 'user' as const, content },
      ];
    }

    // 生成AI回复
    const aiContent = await generateAIResponse(messages, temperature);

    // 分析情感
    const emotionAnalysis = await analyzeEmotion(aiContent);

    // 保存AI消息
    const aiMessage = await prisma.message.create({
      data: {
        sessionId: id,
        role: 'ASSISTANT',
        content: aiContent,
        type: 'TEXT',
        emotionAnalysis: JSON.stringify(emotionAnalysis),
        metadata: JSON.stringify({
          emotionalState: newState,
          behaviorAnalysis: behaviorAnalysis,
        }),
      },
    });

    // 更新会话元数据
    const userMessageCount = (metadata.userMessageCount || 0) + 1;
    const aiMessageCount = (metadata.aiMessageCount || 0) + 1;
    const totalMessageCount = userMessageCount + aiMessageCount;

    // 计算实时指标
    const userTalkRatio = userMessageCount / totalMessageCount;
    const questionCount = (content.match(/[?？]/g) || []).length + 
      (metadata.questionCount || 0);

    await prisma.dialogueSession.update({
      where: { id },
      data: {
        metadata: JSON.stringify({
          ...metadata,
          messageCount: totalMessageCount,
          userMessageCount,
          aiMessageCount,
          questionCount,
          emotionalState: newState,
        }),
        realtimeMetrics: JSON.stringify({
          userTalkRatio: Math.round(userTalkRatio * 100) / 100,
          questionCount,
          lastMessageAt: new Date().toISOString(),
          emotionalState: newState,
        }),
      },
    });

    res.json({
      success: true,
      data: {
        userMessage: {
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          timestamp: userMessage.timestamp,
        },
        aiMessage: {
          id: aiMessage.id,
          role: 'assistant',
          content: aiContent,
          emotionAnalysis,
          timestamp: aiMessage.timestamp,
          metadata: {
            emotionalState: newState,
            behaviorAnalysis: behaviorAnalysis,
          },
        },
        realtimeMetrics: {
          userTalkRatio: Math.round(userTalkRatio * 100) / 100,
          questionCount,
          emotionalState: newState,
        },
      },
    });
  })
);

// 完成对话
router.post(
  '/:id/complete',
  authenticate,
  [param('id').isUUID()],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const session = await prisma.dialogueSession.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'ACTIVE',
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: '会话不存在或已结束' },
      });
    }

    const metadata = JSON.parse(session.metadata || '{}');
    const startTime = new Date(metadata.startTime);
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    await prisma.dialogueSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        metadata: JSON.stringify({
          ...metadata,
          endTime: endTime.toISOString(),
          duration,
        }),
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: id,
        status: 'COMPLETED',
        duration,
        messageCount: metadata.messageCount,
      },
    });
  })
);

// 重新激活已完成的会话（用于继续聊天）
router.patch(
  '/:id/activate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    // 检查会话是否存在且属于当前用户
    const session = await prisma.dialogueSession.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: { in: ['COMPLETED', 'ABANDONED'] },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: '会话不存在或无法重新激活' },
      });
    }

    // 重新激活会话
    const activatedSession = await prisma.dialogueSession.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        scenario: true,
        messages: {
          where: {
            role: { in: ['USER', 'ASSISTANT'] },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // 检查是否为多智能体对话
    const metadata = JSON.parse(activatedSession.metadata || '{}');
    const isMultiAgent = metadata.isMultiAgent;

    res.json({
      success: true,
      data: {
        id: activatedSession.id,
        status: activatedSession.status,
        scenario: isMultiAgent ? {
          id: 'multi-agent',
          title: `多智能体对话: ${metadata.topic}`,
          background: JSON.stringify({ topic: metadata.topic, agents: metadata.agents }),
        } : {
          id: activatedSession.scenario!.id,
          title: activatedSession.scenario!.title,
          background: activatedSession.scenario!.background,
        },
        messages: activatedSession.messages.map(m => ({
          id: m.id,
          role: m.role.toLowerCase(),
          content: m.content,
          type: m.type,
          emotionAnalysis: m.emotionAnalysis ? JSON.parse(m.emotionAnalysis) : null,
          metadata: m.metadata ? JSON.parse(m.metadata) : null,
          timestamp: m.timestamp,
        })),
        metadata: JSON.parse(activatedSession.metadata || '{}'),
        realtimeMetrics: JSON.parse(activatedSession.realtimeMetrics || '{}'),
      },
    });
  })
);

export { router as dialogueRouter };
